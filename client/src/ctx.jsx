import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from './api';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

// Guarda quién inició sesión para toda la aplicación
export function Proveedor({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.yo().then(setUsuario).catch(() => localStorage.removeItem('token')).finally(() => setCargando(false));
  }, []);

  const entrar = (d) => { localStorage.setItem('token', d.token); setUsuario(d.usuario); };
  const salir = () => { localStorage.removeItem('token'); setUsuario(null); };

  return <Ctx.Provider value={{ usuario, cargando, entrar, salir }}>{children}</Ctx.Provider>;
}