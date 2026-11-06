import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../ctx';
import { Tarjeta, Stars, useFav } from '../components/Tarjeta';

// ---------- Inicio: la búsqueda está disponible desde aquí, sin iniciar sesión ----------
export function Inicio() {
  const [q, setQ] = useState('');
  const [destacados, setD] = useState([]);
  const nav = useNavigate();
  const { usuario } = useApp();
  const cargar = useCallback(() => api.comercios().then((l) => setD(l.slice(0, 3))).catch(() => {}), [usuario]);
  useEffect(() => { cargar(); }, [cargar]);
  const fav = useFav(cargar);
  const buscar = (e) => { e.preventDefault(); nav('/explorar?q=' + encodeURIComponent(q)); };
  return (
    <>
      <section className="hero">
        <div>
          <h1>Descubre lo auténtico de Bogotá</h1>
          <p>Cafeterías, restaurantes y tiendas locales que no salen en las guías turísticas.</p>
          <div className="cta"><Link className="btn p" to="/explorar">Explorar lugares</Link><Link className="btn" to="/registro?rol=comercio">Soy un comercio</Link></div>
        </div>
        <div className="shot">
          <img src="/img/hero.jpg" alt="Cafetería con letrero de neón en Chapinero" />
          <form className="sbar" onSubmit={buscar}>
            <span aria-hidden="true">🔍</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cafeterías, restaurantes, tiendas…" aria-label="Buscar lugares" />
            <button className="btn p s">Buscar</button>
          </form>
        </div>
        <div className="feat">
          <div><b>Para extranjeros</b><span>Recomendaciones auténticas en inglés y español.</span></div>
          <div><b>Comercios locales</b><span>Apoya lo local y descubre joyas escondidas.</span></div>
          <div><b>Experiencias únicas</b><span>Vive Bogotá como un local, no como turista.</span></div>
        </div>
      </section>
      <section className="page">
        <h2 style={{ fontSize: 24 }}>Lugares destacados</h2>
        <div className="grid">{destacados.map((c) => <Tarjeta key={c.id} c={c} onFav={fav} />)}</div>
      </section>
    </>
  );
}

// ---------- Explorar: búsqueda con filtro por categoría ----------
export function Explorar() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '', cat = sp.get('cat') || '';
  const [lista, setL] = useState([]);
  const [err, setErr] = useState('');
  const { usuario } = useApp();
  const cargar = useCallback(() => api.comercios(q, cat).then((l) => { setL(l); setErr(''); }).catch((e) => setErr(e.message)), [q, cat, usuario]);
  useEffect(() => { cargar(); }, [cargar]);
  const fav = useFav(cargar);
  const cambiar = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };
  return (
    <div className="page">
      <h1>Explorar lugares</h1>
      <p className="sub">Encuentra comercios auténticos por nombre, zona o categoría.</p>
      <div className="filtros">
        <input className="in" value={q} onChange={(e) => cambiar('q', e.target.value)} placeholder="Cafeterías en Chapinero" aria-label="Buscar" />
        <select className="in" value={cat} onChange={(e) => cambiar('cat', e.target.value)} aria-label="Categoría">
          <option value="">Todas las categorías</option><option>Cafetería</option><option>Restaurante</option><option>Tienda</option>
        </select>
      </div>
      {err && <p className="msg">{err}</p>}
      <p><b style={{ fontSize: 13 }}>Resultados ({lista.length})</b></p>
      <div className="grid">{lista.map((c) => <Tarjeta key={c.id} c={c} onFav={fav} />)}</div>
      {!lista.length && !err && <p className="sub">No encontramos lugares con esa búsqueda. Prueba con otro nombre o zona.</p>}
    </div>
  );
}

// ---------- Perfil de un comercio ----------
const TX = {
  es: { save: '♡ Guardar', saved: '♥ Guardado', share: 'Compartir', dir: 'Cómo llegar', info: 'Información', photos: 'Fotos', rev: 'Reseñas', map: 'Ubicación' },
};

export function Comercio() {
  const { id } = useParams();
  const { usuario, cargando } = useApp();
  const nav = useNavigate();
  const [c, setC] = useState(null), [fotos, setF] = useState([]), [err, setErr] = useState('');
  const t = TX.es;
  useEffect(() => {
    if (cargando) return;
    api.comercio(id).then(setC).catch((e) => setErr(e.message));
    api.fotos(id).then(setF).catch(() => {});
  }, [id, cargando]);
  if (err) return <div className="page"><p className="msg">{err}</p><Link to="/explorar">Volver a explorar</Link></div>;
  if (!c) return null;
  const dir = encodeURIComponent(c.direccion + ', Bogotá, Colombia');
  const fav = async () => {
    if (!usuario) return nav('/login', { state: { desde: '/comercio/' + id } });
    const r = await api.toggleFav(id);
    setC((x) => ({ ...x, fav: r.fav ? 1 : 0, guardados: x.guardados + (r.fav ? 1 : -1) }));
  };
  const llegar = () => { api.clic(id); window.open('https://www.google.com/maps/dir/?api=1&destination=' + dir, '_blank'); };
  const compartir = async () => { try { navigator.share ? await navigator.share({ title: c.nombre, url: location.href }) : await navigator.clipboard.writeText(location.href); } catch {} };
  return (
    <div className="page">
      <div className="prof" style={{ gap: 16 }}>
        <img className="av" src={fotos[0] ? fotos[0].archivo : '/img/teddy.jpg'} alt="" />
        <div><h1 style={{ fontSize: 28 }}>{c.nombre} ✔</h1><small>{c.categoria}</small><br /><Stars n={c.rating} /> <small>{c.rating} ({c.total})</small>
          {c.estado !== 'publicado' && <> <span className="tag">{c.estado === 'pendiente' ? 'En revisión' : 'Borrador'}</span></>}</div>
      </div>
      <div className="cta"><button className="pill" onClick={fav}>{c.fav ? t.saved : t.save}</button><button className="pill" onClick={compartir}>{t.share}</button><button className="pill" onClick={llegar}>{t.dir}</button></div>
      <div className="cols" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <section className="card"><h2>{t.info}</h2><p style={{ margin: 0 }}>{c.descripcion}</p><small>📍 {c.direccion}</small><small>🕗 {c.horario}</small></section>
          <section className="card"><h2>{t.map}</h2><iframe className="mapa" title="Mapa" loading="lazy" src={`https://maps.google.com/maps?q=${dir}&output=embed`} /></section>
          {fotos.length > 0 && <section className="card"><h2>{t.photos}</h2><div className="gal">{fotos.map((f) => <img key={f.id} src={f.archivo} alt="" />)}</div></section>}
        </div>
        <Resenas id={id} titulo={t.rev} />
      </div>
    </div>
  );
}

function Resenas({ id, titulo }) {
  const { usuario } = useApp();
  const [d, setD] = useState({ lista: [], conteo: [] });
  const [f, setF] = useState({ estrellas: 5, texto: '' });
  const [err, setErr] = useState('');
  const cargar = useCallback(() => api.resenas(id).then(setD), [id]);
  useEffect(() => { cargar(); }, [cargar]);
  const total = d.lista.length;
  const prom = total ? (d.lista.reduce((s, r) => s + r.estrellas, 0) / total).toFixed(1) : '0.0';
  const enviar = async (e) => {
    e.preventDefault();
    try { await api.resenar(id, f); setF({ estrellas: 5, texto: '' }); setErr(''); cargar(); } catch (x) { setErr(x.message); }
  };
  return (
    <section className="card" style={{ alignSelf: 'start' }}>
      <h2>{titulo}</h2>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div><div className="big">{prom}</div><Stars n={prom} /><br /><small>{total}</small></div>
        <div style={{ flex: 1, display: 'grid', gap: 4 }}>
          {[5, 4, 3, 2, 1].map((s) => { const n = (d.conteo.find((c) => c.estrellas === s) || {}).n || 0;
            return <div className="bar" key={s}><span>{s}</span><i><s style={{ width: (total ? (n / total) * 100 : 0) + '%' }} /></i><span>{n}</span></div>; })}
        </div>
      </div>
      {usuario ? (
        <form onSubmit={enviar} style={{ display: 'grid', gap: 8 }}>
          <select className="in" value={f.estrellas} onChange={(e) => setF({ ...f, estrellas: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select>
          <textarea className="in" rows="2" required placeholder="Cuéntanos tu experiencia" value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} />
          <button className="btn p s">Publicar reseña</button><div className="msg">{err}</div>
        </form>
      ) : <Link className="btn p" to="/login" state={{ desde: '/comercio/' + id }}>Inicia sesión para dejar una reseña</Link>}
      {d.lista.map((r) => (
        <div className="row" style={{ alignItems: 'flex-start' }} key={r.id}>
          <div className="av" style={{ borderRadius: '50%' }}>{r.autor[0]}</div>
          <div className="t"><b>{r.autor} <small>· {new Date(r.fecha).toLocaleDateString('es-CO')}</small></b><Stars n={r.estrellas} /><br />{r.texto}</div>
        </div>
      ))}
    </section>
  );
}