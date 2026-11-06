import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../ctx';

export const Stars = ({ n }) => { const r = Math.round(n); return <span className="star">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>; };

// Devuelve la función para marcar/desmarcar favorito; si no hay sesión, manda a iniciar sesión
export function useFav(recargar) {
  const { usuario } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  return async (id) => {
    if (!usuario) return nav('/login', { state: { desde: loc.pathname + loc.search } });
    await api.toggleFav(id);
    recargar();
  };
}

export function Tarjeta({ c, onFav }) {
  return (
    <div className="tarjeta">
      <Link to={`/comercio/${c.id}`}>
        {c.portada ? <img src={c.portada} alt={c.nombre} /> : <div className="foto">{c.nombre[0]}</div>}
        <div className="info">
          <b>{c.nombre}</b><br /><small>{c.categoria} · {c.direccion}</small><br />
          {c.total ? <><Stars n={c.rating} /> <small>{c.rating} ({c.total})</small></> : <small>Aún sin reseñas</small>}
        </div>
      </Link>
      <button className="heart" aria-label="Guardar en favoritos" onClick={() => onFav(c.id)}>{c.fav ? '♥' : '♡'}</button>
    </div>
  );
}
