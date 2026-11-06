require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const SECRET = process.env.JWT_SECRET || 'cambia_este_secreto';
const app = express();
app.use(cors(), express.json());

// Hosts como Aiven exigen puerto propio y conexión cifrada (SSL)
const ssl = process.env.DB_CA
  ? { ca: process.env.DB_CA.replace(/\\n/g, '\n') }
  : process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'hiddenbogota',
  ssl,
});

// ---------- Subida de fotos ----------
const UP = path.join(__dirname, 'uploads');
fs.mkdirSync(UP, { recursive: true });
app.use('/uploads', express.static(UP));
const upload = multer({
  storage: multer.diskStorage({
    destination: UP,
    filename: (req, f, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(f.originalname).toLowerCase()),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(f.mimetype)),
});

// ---------- Utilidades de sesión (JWT) ----------
const ruta = (fn) => (req, res) =>
  fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: e.message }); });
const firmar = (u) => jwt.sign({ id: u.id, nombre: u.nombre, rol: u.rol }, SECRET, { expiresIn: '7d' });

// Lee el token si viene (no obliga a iniciar sesión)
app.use((req, res, next) => {
  const t = (req.get('authorization') || '').replace('Bearer ', '');
  try { req.user = jwt.verify(t, SECRET); } catch { req.user = null; }
  next();
});
// Obliga a iniciar sesión (y opcionalmente a tener cierto rol)
const exigir = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Inicia sesión para continuar' });
  if (roles.length && !roles.includes(req.user.rol)) return res.status(403).json({ error: 'No tienes permiso para esto' });
  next();
};
const uid = (req) => (req.user ? req.user.id : 0);

// ---------- Autenticación ----------
app.post('/api/auth/registro', ruta(async (req, res) => {
  const { nombre, email, password, rol, ref } = req.body;
  if (!nombre || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6)
    return res.status(400).json({ error: 'Escribe tu nombre, un correo válido y una contraseña de mínimo 6 caracteres' });
  const [ya] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase()]);
  if (ya.length) return res.status(409).json({ error: 'Ese correo ya está registrado' });
  let refId = null;
  if (ref) { const [q] = await db.query('SELECT id FROM usuarios WHERE codigo = ?', [ref]); refId = q[0] ? q[0].id : null; }
  const hash = await bcrypt.hash(password, 10);
  const codigo = Math.random().toString(36).slice(2, 8).toUpperCase();
  const rolFinal = rol === 'comercio' ? 'comercio' : 'turista';
  const [r] = await db.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol, codigo, referido_por) VALUES (?,?,?,?,?,?)',
    [nombre, email.toLowerCase(), hash, rolFinal, codigo, refId]);
  const u = { id: r.insertId, nombre, rol: rolFinal };
  res.status(201).json({ token: firmar(u), usuario: u });
}));

app.post('/api/auth/login', ruta(async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [(email || '').toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  const usuario = { id: u.id, nombre: u.nombre, rol: u.rol };
  res.json({ token: firmar(usuario), usuario });
}));

app.get('/api/auth/yo', exigir(), (req, res) => res.json({ id: req.user.id, nombre: req.user.nombre, rol: req.user.rol }));

// ---------- Comercios (público) ----------
const SEL = `SELECT c.*, ROUND(IFNULL(AVG(r.estrellas),0),1) AS rating, COUNT(r.id) AS total,
  (SELECT COUNT(*) FROM favoritos f WHERE f.comercio_id = c.id) AS guardados,
  EXISTS(SELECT 1 FROM favoritos f WHERE f.comercio_id = c.id AND f.usuario_id = ?) AS fav,
  (SELECT archivo FROM fotos WHERE comercio_id = c.id ORDER BY id LIMIT 1) AS portada
  FROM comercios c LEFT JOIN resenas r ON r.comercio_id = c.id`;

app.get('/api/comercios', ruta(async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const cat = req.query.categoria || '%';
  const [rows] = await db.query(
    SEL + " WHERE c.estado = 'publicado' AND (c.nombre LIKE ? OR c.direccion LIKE ? OR c.descripcion LIKE ?) AND c.categoria LIKE ? GROUP BY c.id ORDER BY rating DESC, total DESC",
    [uid(req), q, q, q, cat]);
  res.json(rows);
}));

app.get('/api/comercios/:id', ruta(async (req, res) => {
  const [rows] = await db.query(SEL + ' WHERE c.id = ? GROUP BY c.id', [uid(req), req.params.id]);
  const c = rows[0];
  const dueno = req.user && c && (req.user.id === c.usuario_id || req.user.rol === 'admin');
  if (!c || (c.estado !== 'publicado' && !dueno)) return res.status(404).json({ error: 'Comercio no encontrado' });
  if (!dueno) await db.query('UPDATE comercios SET visitas = visitas + 1 WHERE id = ?', [c.id]);
  res.json(c);
}));

app.post('/api/comercios/:id/clic', ruta(async (req, res) => {
  await db.query('UPDATE comercios SET clics = clics + 1 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

app.get('/api/comercios/:id/fotos', ruta(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM fotos WHERE comercio_id = ? ORDER BY id', [req.params.id]);
  res.json(rows);
}));

app.get('/api/comercios/:id/resenas', ruta(async (req, res) => {
  const [lista] = await db.query('SELECT * FROM resenas WHERE comercio_id = ? ORDER BY fecha DESC', [req.params.id]);
  const [conteo] = await db.query('SELECT estrellas, COUNT(*) AS n FROM resenas WHERE comercio_id = ? GROUP BY estrellas', [req.params.id]);
  res.json({ lista, conteo });
}));

app.post('/api/comercios/:id/resenas', exigir(), ruta(async (req, res) => {
  const { estrellas, texto } = req.body;
  const e = Number(estrellas);
  if (!texto || !(e >= 1 && e <= 5)) return res.status(400).json({ error: 'Elige de 1 a 5 estrellas y escribe un comentario' });
  const [c] = await db.query("SELECT usuario_id FROM comercios WHERE id = ? AND estado = 'publicado'", [req.params.id]);
  if (!c[0]) return res.status(404).json({ error: 'Comercio no encontrado' });
  if (c[0].usuario_id === req.user.id) return res.status(403).json({ error: 'No puedes reseñar tu propio negocio' });
  await db.query(
    `INSERT INTO resenas (comercio_id, usuario_id, autor, estrellas, texto) VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE estrellas = VALUES(estrellas), texto = VALUES(texto), fecha = NOW()`,
    [req.params.id, req.user.id, req.user.nombre, e, texto]);
  res.status(201).json({ ok: true });
}));

// ---------- Favoritos (requiere sesión) ----------
app.get('/api/favoritos', exigir(), ruta(async (req, res) => {
  const [rows] = await db.query(
    SEL + " WHERE c.estado = 'publicado' AND EXISTS(SELECT 1 FROM favoritos f WHERE f.comercio_id = c.id AND f.usuario_id = ?) GROUP BY c.id",
    [uid(req), uid(req)]);
  res.json(rows);
}));
app.post('/api/favoritos/:id', exigir(), ruta(async (req, res) => {
  const [d] = await db.query('DELETE FROM favoritos WHERE usuario_id = ? AND comercio_id = ?', [uid(req), req.params.id]);
  if (!d.affectedRows) await db.query('INSERT INTO favoritos (usuario_id, comercio_id) VALUES (?,?)', [uid(req), req.params.id]);
  res.json({ fav: !d.affectedRows });
}));

// ---------- Referidos ----------
app.get('/api/referidos', exigir(), ruta(async (req, res) => {
  const [[u]] = await db.query('SELECT codigo FROM usuarios WHERE id = ?', [uid(req)]);
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM usuarios WHERE referido_por = ?', [uid(req)]);
  res.json({ codigo: u.codigo, exitosos: n, beneficios: Math.floor(n / 3) }); // 1 beneficio cada 3 referidos
}));

// ---------- Panel del comercio ----------
const mio = async (id) => (await db.query(SEL + ' WHERE c.usuario_id = ? GROUP BY c.id', [id, id]))[0][0] || null;
const solo = exigir('comercio');
const registrarRutasPagos = require('./pagos');

registrarRutasPagos({
  app,
  db,
  soloComercio: solo,
  ruta,
});

app.get('/api/mi-negocio', solo, ruta(async (req, res) => res.json(await mio(req.user.id))));

app.put('/api/mi-negocio', solo, ruta(async (req, res) => {
  const { nombre, direccion, categoria, descripcion, descripcion_en, horario } = req.body;
  if (!nombre || !direccion) return res.status(400).json({ error: 'Nombre y dirección son obligatorios' });
  const m = await mio(req.user.id);
  const datos = [nombre, direccion, categoria || 'Cafetería', descripcion || '', descripcion_en || descripcion || '', horario || 'Lun - Dom · 8:00 a. m. - 8:00 p. m.'];
  if (m) await db.query('UPDATE comercios SET nombre=?, direccion=?, categoria=?, descripcion=?, descripcion_en=?, horario=? WHERE id=?', [...datos, m.id]);
  else await db.query('INSERT INTO comercios (nombre, direccion, categoria, descripcion, descripcion_en, horario, usuario_id) VALUES (?,?,?,?,?,?,?)', [...datos, req.user.id]);
  res.json(await mio(req.user.id));
}));

app.post('/api/mi-negocio/enviar', solo, ruta(async (req, res) => {
  await db.query("UPDATE comercios SET estado = 'pendiente' WHERE usuario_id = ? AND estado = 'borrador'", [req.user.id]);
  res.json({ ok: true });
}));

app.post('/api/mi-negocio/fotos', solo, upload.single('foto'), ruta(async (req, res) => {
  const m = await mio(req.user.id);
  if (!m) return res.status(400).json({ error: 'Primero registra tu negocio' });
  if (!req.file) return res.status(400).json({ error: 'Sube una imagen JPG, PNG o WEBP de máximo 3 MB' });
  await db.query('INSERT INTO fotos (comercio_id, archivo) VALUES (?,?)', [m.id, '/uploads/' + req.file.filename]);
  res.status(201).json({ ok: true });
}));

app.delete('/api/mi-negocio/fotos/:fid', solo, ruta(async (req, res) => {
  const m = await mio(req.user.id);
  const [f] = await db.query('SELECT * FROM fotos WHERE id = ? AND comercio_id = ?', [req.params.fid, m ? m.id : 0]);
  if (!f[0]) return res.status(404).json({ error: 'Foto no encontrada' });
  await db.query('DELETE FROM fotos WHERE id = ?', [f[0].id]);
  if (f[0].archivo.startsWith('/uploads/')) fs.unlink(path.join(__dirname, f[0].archivo), () => {});
  res.json({ ok: true });
}));

// ---------- Administración ----------
const admin = exigir('admin');
app.get('/api/admin/pendientes', admin, ruta(async (req, res) => {
  const [rows] = await db.query("SELECT c.*, u.nombre AS dueno, u.email FROM comercios c LEFT JOIN usuarios u ON u.id = c.usuario_id WHERE c.estado = 'pendiente'");
  res.json(rows);
}));
app.put('/api/admin/comercios/:id/publicar', admin, ruta(async (req, res) => {
  await db.query("UPDATE comercios SET estado = 'publicado' WHERE id = ?", [req.params.id]); res.json({ ok: true });
}));
app.put('/api/admin/comercios/:id/rechazar', admin, ruta(async (req, res) => {
  await db.query("UPDATE comercios SET estado = 'borrador' WHERE id = ?", [req.params.id]); res.json({ ok: true });
}));

// ---------- Crea el administrador la primera vez ----------
(async () => {
  try {
    const [a] = await db.query("SELECT id FROM usuarios WHERE rol = 'admin'");
    if (a.length) return;
    const email = (process.env.ADMIN_EMAIL || 'admin@hiddenbogota.co').toLowerCase();
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin2026!', 10);
    await db.query("INSERT INTO usuarios (nombre, email, password_hash, rol, codigo) VALUES ('Administrador', ?, ?, 'admin', 'ADMIN1')", [email, hash]);
    console.log('Administrador creado:', email);
  } catch (e) { console.error('No se pudo crear el administrador:', e.message); }
})();

// ---------- Sirve el frontend compilado (producción: un solo servicio) ----------
const DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

const port = process.env.PORT || 3001;
app.listen(port, () => console.log('API Hidden Bogotá en http://localhost:' + port));
