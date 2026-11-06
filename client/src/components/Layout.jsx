import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../ctx';
import { IDIOMAS, idiomaActual, cambiarIdioma } from '../idioma';

export default function Layout() {
  const { usuario, salir } = useApp();
  const nav = useNavigate();

  return (
    <>
      <header>
        <Link className="brand" to="/">
          <svg width="26" height="32" viewBox="0 0 26 32" aria-hidden="true">
            <path
              d="M13 1C6.4 1 1 6 1 12.4 1 21 13 31 13 31s12-10 12-18.600C25 6 19.600 1 13 1z"
              fill="#881E3F"
            />
            <path
              d="M13 17.500 8.500 13a3 3 0 1 1 4.500-3.800A3 3 0 1 1 17.500 13z"
              fill="#FFF7F2"
            />
          </svg>
          <span translate="no">
            <b>HIDDEN</b>
            <i>Bogotá</i>
          </span>
        </Link>

        <nav>
          <NavLink to="/explorar">Explorar</NavLink>
          {!usuario && <NavLink to="/registro?rol=comercio">Para comercios</NavLink>}
          {usuario && <NavLink to="/favoritos">Favoritos</NavLink>}
          {usuario && <NavLink to="/referidos">Referidos</NavLink>}
          {usuario?.rol === 'comercio' && <NavLink to="/panel">Mi panel</NavLink>}
          {usuario?.rol === 'admin' && <NavLink to="/admin">Administración</NavLink>}
        </nav>

        <div className="hr">
          <select
            className="pill"
            translate="no"
            defaultValue={idiomaActual()}
            onChange={(e) => cambiarIdioma(e.target.value)}
            aria-label="Idioma"
          >
            {IDIOMAS.map(([codigo, nombre]) => (
              <option key={codigo} value={codigo}>
                {nombre}
              </option>
            ))}
          </select>

          {usuario ? (
            <>
              <span>Hola, {usuario.nombre.split(' ')[0]}</span>
              <button
                className="btn s"
                onClick={() => {
                  salir();
                  nav('/');
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="btn s" to="/login">Iniciar sesión</Link>
              <Link className="btn p s" to="/registro">Regístrate</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <img
          src="/img/logo.jpg"
          alt="Hidden Bogotá, descubre lo que no todos conocen"
        />

        <div className="footer-columns">
          <section>
            <h2>Contacto</h2>
            <a href="mailto:hidenbogota@gmail.co">hidenbogota@gmail.co</a>
            <a href="tel:+573143270530">+57 314 327 0530</a>
            <span>Carrera 73A N.º 81B–70, Bogotá, Colombia</span>
          </section>

          <section>
  <h2>Precios y pagos</h2>
  <Link to="/precios">Planes para comercios</Link>
</section>

          <section>
            <h2>Privacidad y condiciones</h2>
            <Link to="/politicas/privacidad">Aviso de privacidad</Link>
            <Link to="/politicas/datos">Tratamiento de datos personales</Link>
            <Link to="/politicas/respaldo">Política de respaldo</Link>
            <Link to="/politicas/cookies">Política de cookies</Link>
            <Link to="/politicas/creditos">Créditos y derechos reservados</Link>
          </section>
        </div>

        <p>© 2026 Hidden Bogotá · Todos los derechos reservados.</p>
      </footer>
    </>
  );
}