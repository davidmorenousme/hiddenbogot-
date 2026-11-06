import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { api } from '../api';

const ESTADO = { borrador: 'Borrador', pendiente: 'En revisión', publicado: 'Publicado' };

export function Panel() {
  return (
    <div className="page"><div className="panel">
      <aside className="side"><NavLink end to="/panel">Resumen</NavLink><NavLink to="/panel/negocio">Mi negocio</NavLink><NavLink to="/panel/galeria">Galería</NavLink></aside>
      <div><Outlet /></div>
    </div></div>
  );
}

const SinNegocio = () => (
  <section className="card"><h2>Aún no tienes un negocio registrado</h2><p>Regístralo para que aparezca en Hidden Bogotá.</p><Link className="btn p" to="/panel/negocio">Registrar mi negocio</Link></section>
);

export function Resumen() {
  const [c, setC] = useState();
  const [conteo, setCo] = useState([]);
  useEffect(() => { api.miNegocio().then((m) => { setC(m); if (m) api.resenas(m.id).then((r) => setCo(r.conteo)); }); }, []);
  if (c === undefined) return null;
  if (!c) return <SinNegocio />;
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="card">
        <h2>{c.nombre} <span className="tag">{ESTADO[c.estado]}</span></h2>
        {c.estado === 'borrador' && <><p style={{ margin: 0 }}>Tu negocio aún no es visible. Cuando esté listo, envíalo para que lo revisemos.</p>
          <button className="btn p s" style={{ justifySelf: 'start' }} onClick={() => api.enviarNegocio().then(() => setC({ ...c, estado: 'pendiente' }))}>Enviar para publicación</button></>}
        {c.estado === 'pendiente' && <p style={{ margin: 0 }}>Estamos revisando tu negocio. Te aparecerá como publicado cuando lo aprobemos.</p>}
        {c.estado === 'publicado' && <Link to={'/comercio/' + c.id}>Ver mi perfil público</Link>}
      </section>
      <section className="card">
        <h2>Estadísticas</h2>
        <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))' }}>
          <div><small>Visitas al perfil</small><b>{c.visitas}</b></div><div><small>Clics en cómo llegar</small><b>{c.clics}</b></div>
          <div><small>Guardados</small><b>{c.guardados}</b></div><div><small>Calificación</small><b>{c.total ? c.rating : '–'}</b></div>
        </div>
        {[5, 4, 3, 2, 1].map((s) => { const n = (conteo.find((x) => x.estrellas === s) || {}).n || 0;
          return <div className="bar" key={s}><span>{s}</span><i><s style={{ width: (c.total ? (n / c.total) * 100 : 0) + '%' }} /></i><span>{n}</span></div>; })}
      </section>
    </div>
  );
}

const VACIO = { nombre: '', direccion: '', categoria: 'Cafetería', descripcion: '', descripcion_en: '', horario: '' };

export function Negocio() {
  const [f, setF] = useState(VACIO);
  const [estado, setEstado] = useState(null);
  const [m, setM] = useState('');
  useEffect(() => { api.miNegocio().then((c) => { if (c) { setEstado(c.estado); setF({ ...VACIO, ...Object.fromEntries(Object.keys(VACIO).map((k) => [k, c[k] ?? ''])) }); } }); }, []);
  const ch = (e) => setF({ ...f, [e.target.name]: e.target.value });
  const guardar = async (e) => {
    e.preventDefault();
    try { const c = await api.guardarNegocio(f); setEstado(c.estado); setM('Cambios guardados.'); } catch (x) { setM(x.message); }
  };
  return (
    <section className="card">
      <h2>Mi negocio {estado && <span className="tag">{ESTADO[estado]}</span>}</h2>
      <form onSubmit={guardar} style={{ display: 'grid', gap: 8 }}>
        <label>Nombre del negocio<input className="in" name="nombre" required value={f.nombre} onChange={ch} /></label>
        <label>Dirección<input className="in" name="direccion" required value={f.direccion} onChange={ch} /></label>
        <label>Categoría<select className="in" name="categoria" value={f.categoria} onChange={ch}><option>Cafetería</option><option>Restaurante</option><option>Tienda</option></select></label>
        <label>Horario<input className="in" name="horario" placeholder="Lun - Dom · 8:00 a. m. - 8:00 p. m." value={f.horario} onChange={ch} /></label>
        <label>Descripción<textarea className="in" rows="3" name="descripcion" value={f.descripcion} onChange={ch} /></label>
        <div className="cta" style={{ margin: 0 }}>
          <button className="btn s">Guardar</button>
          {estado === 'borrador' && <button type="button" className="btn p s" onClick={() => api.enviarNegocio().then(() => { setEstado('pendiente'); setM('Enviado para publicación.'); })}>Enviar para publicación</button>}
        </div>
        <div className="msg" role="status">{m}</div>
      </form>
    </section>
  );
}

export function Galeria() {
  const [c, setC] = useState();
  const [fotos, setF] = useState([]);
  const [m, setM] = useState('');
  const cargar = (id) => api.fotos(id).then(setF);
  useEffect(() => { api.miNegocio().then((x) => { setC(x); if (x) cargar(x.id); }); }, []);
  if (c === undefined) return null;
  if (!c) return <SinNegocio />;
  const subir = async (e) => {
    const fd = new FormData(); fd.append('foto', e.target.files[0]);
    try { await api.subirFoto(fd); setM(''); cargar(c.id); } catch (x) { setM(x.message); }
    e.target.value = '';
  };
  return (
    <section className="card">
      <h2>Gestión de galería</h2><p className="sub">La primera foto es la portada de tu negocio.</p>
      <div className="gal">{fotos.map((f) => <div key={f.id} style={{ position: 'relative', display: 'block' }}><img src={f.archivo} alt="" />
        {f.archivo.startsWith('/uploads/') && <button className="heart" style={{ position: 'absolute', top: 4, right: 4, background: 'var(--card)', borderRadius: '50%', width: 28, height: 28, fontSize: 14 }} aria-label="Eliminar foto" onClick={() => api.borrarFoto(f.id).then(() => cargar(c.id))}>✕</button>}</div>)}</div>
      <label className="btn s" style={{ textAlign: 'center', cursor: 'pointer' }}>+ Agregar foto<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={subir} /></label>
      <div className="msg">{m}</div>
    </section>
  );
}