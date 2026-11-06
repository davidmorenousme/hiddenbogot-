import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './ctx';
import Layout from './components/Layout';
import { Inicio, Explorar, Comercio } from './pages/Publicas';
import {
  Login,
  Registro,
  Favoritos,
  Referidos,
} from './pages/Cuenta';
import {
  Panel,
  Resumen,
  Negocio,
  Galeria,
} from './pages/Panel';
import Admin from './pages/Admin';
import {
  Politicas,
  Precios,
  PagoDemo,
} from './pages/Legal';

function Privada({ roles, children }) {
  const { usuario, cargando } = useApp();
  const loc = useLocation();

  if (cargando) {
    return <p className="page">Cargando…</p>;
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        state={{ desde: loc.pathname }}
        replace
      />
    );
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="explorar" element={<Explorar />} />
        <Route path="comercio/:id" element={<Comercio />} />

        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />

        <Route path="precios" element={<Precios />} />

        <Route
          path="pago"
          element={
            <Privada roles={['comercio']}>
              <PagoDemo />
            </Privada>
          }
        />

        <Route path="politicas/:tipo" element={<Politicas />} />

        <Route
          path="favoritos"
          element={
            <Privada>
              <Favoritos />
            </Privada>
          }
        />

        <Route
          path="referidos"
          element={
            <Privada>
              <Referidos />
            </Privada>
          }
        />

        <Route
          path="panel"
          element={
            <Privada roles={['comercio']}>
              <Panel />
            </Privada>
          }
        >
          <Route index element={<Resumen />} />
          <Route path="negocio" element={<Negocio />} />
          <Route path="galeria" element={<Galeria />} />
        </Route>

        <Route
          path="admin"
          element={
            <Privada roles={['admin']}>
              <Admin />
            </Privada>
          }
        />

        <Route
          path="*"
          element={<p className="page">Esta página no existe.</p>}
        />
      </Route>
    </Routes>
  );
}