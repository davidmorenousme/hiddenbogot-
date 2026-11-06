import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export default function Admin() {
  const [l, setL] = useState([]);
  const cargar = useCallback(() => api.pendientes().then(setL), []);
  useEffect(() => { cargar(); }, [cargar]);
  const accion = (fn, id) => fn(id).then(cargar);
  return (
    <div className="page">
      <h1>Administración</h1><p className="sub">Comercios que esperan aprobación para publicarse.</p>
      <div style={{ display: 'grid', gap: 10, maxWidth: 720 }}>
        {l.map((c) => (
          <div className="card" key={c.id}>
            <h2>{c.nombre} <span className="tag">{c.categoria}</span></h2>
            <small>📍 {c.direccion} · Dueño: {c.dueno || '—'} ({c.email || 'sin correo'})</small>
            <p style={{ margin: 0 }}>{c.descripcion}</p>
            <div className="cta" style={{ margin: 0 }}><button className="btn p s" onClick={() => accion(api.publicar, c.id)}>Publicar</button><button className="btn s" onClick={() => accion(api.rechazar, c.id)}>Devolver a borrador</button></div>
          </div>
        ))}
        {!l.length && <p>No hay comercios pendientes por revisar.</p>}
      </div>
    </div>
  );
}
