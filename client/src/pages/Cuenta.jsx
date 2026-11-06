import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../ctx';
import { Tarjeta, useFav } from '../components/Tarjeta';

const irA = (rol) => (rol === 'comercio' ? '/panel' : rol === 'admin' ? '/admin' : '/');

export function Login() {
  const { entrar } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const enviar = async (e) => {
    e.preventDefault();
    try { const d = await api.login(f); entrar(d); nav(loc.state?.desde || irA(d.usuario.rol), { replace: true }); }
    catch (x) { setErr(x.message); }
  };
  return (
    <div className="card auth">
      <h1 style={{ fontSize: 26 }}>Iniciar sesión</h1>
      <form onSubmit={enviar}>
        <label>Correo<input className="in" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Contraseña<input className="in" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn p">Entrar</button><div className="msg" role="alert">{err}</div>
      </form>
      <small>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></small>
    </div>
  );
}

export function Registro() {
  const [sp] = useSearchParams();
  const { entrar } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ nombre: '', email: '', password: '', rol: sp.get('rol') === 'comercio' ? 'comercio' : 'turista' });
  const [err, setErr] = useState('');
  const ch = (e) => setF({ ...f, [e.target.name]: e.target.value });
  const enviar = async (e) => {
    e.preventDefault();
    try { const d = await api.registro({ ...f, ref: sp.get('ref') }); entrar(d); nav(d.usuario.rol === 'comercio' ? '/panel/negocio' : '/explorar'); }
    catch (x) { setErr(x.message); }
  };
  return (
    <div className="card auth">
      <h1 style={{ fontSize: 26 }}>Crear cuenta</h1>
      {sp.get('ref') && <small>Te invitó un amigo con el código <b>{sp.get('ref')}</b>.</small>}
      <form onSubmit={enviar}>
        <label>Soy<select className="in" name="rol" value={f.rol} onChange={ch}><option value="turista">Turista / visitante</option><option value="comercio">Dueño de un comercio</option></select></label>
        <label>Nombre<input className="in" name="nombre" required value={f.nombre} onChange={ch} /></label>
        <label>Correo<input className="in" type="email" name="email" required value={f.email} onChange={ch} /></label>
        <label>Contraseña (mínimo 6 caracteres)<input className="in" type="password" name="password" required minLength="6" value={f.password} onChange={ch} /></label>
        <button className="btn p">Crear cuenta</button><div className="msg" role="alert">{err}</div>
      </form>
      <small>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></small>
    </div>
  );
}

export function Favoritos() {
  const [l, setL] = useState([]);
  const cargar = useCallback(() => api.favoritos().then(setL), []);
  useEffect(() => { cargar(); }, [cargar]);
  const fav = useFav(cargar);
  return (
    <div className="page">
      <h1>Mis favoritos</h1>
      <p className="sub">Los lugares que guardaste para visitar.</p>
      <div className="grid">{l.map((c) => <Tarjeta key={c.id} c={c} onFav={fav} />)}</div>
      {!l.length && <p>Aún no guardas lugares. <Link to="/explorar">Explora y toca el corazón</Link> en los que te gusten.</p>}
    </div>
  );
}

export function Referidos() {
  const [d, setD] = useState(null);
  const [ok, setOk] = useState(false);
  useEffect(() => { api.referidos().then(setD); }, []);
  if (!d) return null;
  const link = `${location.origin}/registro?ref=${d.codigo}`;
  return (
    <div className="page">
      <h1>Referidos y recomendaciones</h1>
      <p className="sub">Invita a otros y obtén beneficios: ganas 1 beneficio por cada 3 amigos que se registren con tu enlace.</p>
      <section className="card" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', gap: 6 }}><input className="in" readOnly value={link} aria-label="Tu enlace" />
          <button className="btn s" onClick={async () => { try { await navigator.clipboard.writeText(link); } catch {} setOk(true); }}>{ok ? 'Copiado' : 'Copiar'}</button></div>
        <div className="stats" style={{ gridTemplateColumns: '1fr 1fr' }}><div><small>Referidos exitosos</small><b>{d.exitosos}</b></div><div><small>Beneficios obtenidos</small><b>{d.beneficios}</b></div></div>
      </section>
    </div>
  );
}
