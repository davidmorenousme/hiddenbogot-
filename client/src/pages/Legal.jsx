import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const politicas = {
  privacidad: {
    titulo: 'Aviso de privacidad',
    contenido: (
      <>
        <p>
          Hidden Bogotá conecta turistas extranjeros con comercios locales.
          Tratamos los datos personales de forma confidencial para operar la
          plataforma y prestar sus servicios.
        </p>
        <h2>Finalidades</h2>
        <p>
          Usamos los datos para administrar cuentas y perfiles de comercios,
          publicar reseñas y gestionar las afiliaciones de los comercios.
        </p>
        <h2>Datos recopilados</h2>
        <p>
          Podemos recopilar nombre, correo electrónico, contraseña, país de
          origen, idioma y datos del comercio, como nombre, dirección, teléfono
          y fotografías.
        </p>
        <h2>Derechos del titular</h2>
        <p>
          Para solicitar acceso, actualización, rectificación o eliminación de
          tus datos, escribe a{' '}
          <a href="mailto:hidenbogota@gmail.co">hidenbogota@gmail.co</a>.
        </p>
        <p>
          Oficina: Carrera 73A N.º 81B – 70, Bogotá. Teléfono:{' '}
          <a href="tel:3143270530">3143270530</a>.
        </p>
      </>
    ),
  },

  datos: {
    titulo: 'Política de tratamiento de datos personales',
    contenido: (
      <>
        <p>
          Hidden Bogotá trata los datos personales para operar las cuentas,
          mostrar perfiles de comercios, gestionar favoritos y reseñas, y
          responder solicitudes.
        </p>
        <h2>Seguridad y acceso</h2>
        <p>
          La plataforma contempla roles de turista, comercio y administrador.
          Las contraseñas se protegen mediante hashing con bcrypt.
        </p>
        <h2>Consultas y reclamos</h2>
        <p>
          Para ejercer tus derechos sobre tus datos personales, escribe a{' '}
          <a href="mailto:hidenbogota@gmail.co">hidenbogota@gmail.co</a>.
        </p>
      </>
    ),
  },

  respaldo: {
    titulo: 'Política de copias de respaldo',
    contenido: (
      <>
        <p>
          La información de Hidden Bogotá debe contar con copias de seguridad
          periódicas y protegidas, incluyendo cuentas, comercios y reseñas.
        </p>
        <p>
          Las copias deben almacenarse con acceso restringido y probarse
          mediante restauraciones periódicas. La automatización debe
          configurarse en el servidor donde se publique la aplicación.
        </p>
      </>
    ),
  },

  cookies: {
    titulo: 'Política de cookies y almacenamiento local',
    contenido: (
      <>
        <p>
          Hidden Bogotá utiliza almacenamiento local del navegador para
          conservar la sesión del usuario entre recargas de la aplicación.
        </p>
        <p>
          El sistema registra visitas a perfiles y clics en “Cómo llegar” para
          mostrar métricas a los comercios.
        </p>
      </>
    ),
  },

  creditos: {
    titulo: 'Créditos y derechos reservados',
    contenido: (
      <>
        <p>
          Hidden Bogotá es un proyecto digital para descubrir comercios locales
          auténticos en Bogotá.
        </p>
        <p>
          © 2026 Hidden Bogotá. Todos los derechos reservados sobre los
          contenidos y elementos propios de la plataforma. Las marcas y
          contenidos de terceros pertenecen a sus respectivos titulares.
        </p>
      </>
    ),
  },
};

export function Politicas() {
  const { tipo } = useParams();
  const politica = politicas[tipo];

  if (!politica) {
    return (
      <section className="page">
        <h1>Documento no encontrado</h1>
        <Link to="/">Volver al inicio</Link>
      </section>
    );
  }

  return (
    <article className="page legal">
      <p className="tag">Hidden Bogotá</p>
      <h1>{politica.titulo}</h1>
      <p className="sub">Última actualización: 23 de octubre de 2026</p>
      <div className="legal-copy">{politica.contenido}</div>
      <Link to="/" className="btn s">
        Volver al inicio
      </Link>
    </article>
  );
}

export function Precios() {
  return (
    <section className="page">
      <p className="tag">Para comercios</p>
      <h1>Planes y costos</h1>
      <p className="sub">
        Una forma sencilla de promocionar lugares auténticos de Bogotá.
      </p>

      <div className="price-grid">
        <article className="card">
          <h2>Perfil en Hidden Bogotá</h2>
          <p>
            Registro del comercio, publicación del perfil, ubicación y datos de
            contacto para que visitantes puedan descubrirlo.
          </p>
          <strong className="price">Gratis</strong>
          <small>
            El perfil requiere revisión y aprobación del equipo administrador.
          </small>
        </article>

        <article className="card">
          <h2>Visibilidad destacada</h2>
          <p>
            Afiliación mensual para destacar el perfil del comercio y consultar
            métricas de visitas e interés.
          </p>
          <strong className="price">
            $80.000 COP <small>/ mes</small>
          </strong>
          <small>
            El pago se confirma al finalizar el proceso con tarjeta.
          </small>
          <Link className="btn p" to="/pago">
            Pagar afiliación
          </Link>
        </article>
      </div>
    </section>
  );
}

function obtenerMarca(numero) {
  const digitos = numero.replace(/\D/g, '');

  if (/^4/.test(digitos)) return 'Visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digitos)) {
    return 'Mastercard';
  }
  if (/^3[47]/.test(digitos)) return 'American Express';
  if (/^6/.test(digitos)) return 'Discover u otra tarjeta';
  if (digitos.length >= 4) return 'Marca no reconocida';
  return '';
}

function validarNumero(numero) {
  const digitos = numero.replace(/\D/g, '');

  if (digitos.length < 13 || digitos.length > 19) return false;

  let suma = 0;
  let duplicar = false;

  for (let i = digitos.length - 1; i >= 0; i--) {
    let digito = Number(digitos[i]);

    if (duplicar) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }

    suma += digito;
    duplicar = !duplicar;
  }

  return suma % 10 === 0;
}

export function PagoDemo() {
  const [nombre, setNombre] = useState('');
  const [numero, setNumero] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv, setCvv] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [exitoso, setExitoso] = useState(false);

  const marca = obtenerMarca(numero);

  function pagar(evento) {
    evento.preventDefault();
    setMensaje('');
    setExitoso(false);

    const digitos = numero.replace(/\D/g, '');
    const [mesTexto, anioTexto] = vencimiento.split('/');
    const mes = Number(mesTexto);
    const anioIngresado = Number(anioTexto);
    const anio = anioIngresado < 100 ? 2000 + anioIngresado : anioIngresado;
    const ahora = new Date();

    const fechaValida =
      mes >= 1 &&
      mes <= 12 &&
      anio >= ahora.getFullYear() &&
      (anio > ahora.getFullYear() || mes >= ahora.getMonth() + 1);

    if (!nombre.trim()) {
      setMensaje('Escribe el nombre de la tarjeta.');
      return;
    }

    if (!validarNumero(digitos)) {
      setMensaje('El número de tarjeta no es válido.');
      return;
    }

    if (!fechaValida) {
      setMensaje('Ingresa un vencimiento futuro en formato MM/AA.');
      return;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      setMensaje('El CVV debe tener 3 o 4 dígitos.');
      return;
    }

    setExitoso(true);
    setMensaje(
      `Pago exitoso de $80.000 COP. ${marca}, terminada en ${digitos.slice(-4)}.`
    );
  }

  return (
    <section className="page">
      <p className="tag">Pago con tarjeta</p>
      <h1>Afiliación destacada</h1>
      <p className="sub">$80.000 COP mensuales</p>

      <form className="card payment-form" onSubmit={pagar}>
        <label>
          Nombre en la tarjeta
          <input
            className="in"
            autoComplete="off"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>

        <label>
          Número de tarjeta
          <input
            className="in"
            inputMode="numeric"
            autoComplete="off"
            placeholder="4111 1111 1111 1111"
            value={numero}
            onChange={(e) => {
              const digitos = e.target.value.replace(/\D/g, '').slice(0, 19);
              setNumero(digitos.replace(/(\d{4})(?=\d)/g, '$1 '));
              setMensaje('');
              setExitoso(false);
            }}
            required
          />
        </label>

        {marca && (
          <p className="card-brand" aria-live="polite">
            Tarjeta detectada: <strong>{marca}</strong>
          </p>
        )}

        <div className="card-meta">
          <label>
            Vencimiento
            <input
              className="in"
              inputMode="numeric"
              placeholder="MM/AA"
              maxLength={5}
              value={vencimiento}
              onChange={(e) => {
                let valor = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (valor.length > 2) {
                  valor = `${valor.slice(0, 2)}/${valor.slice(2)}`;
                }
                setVencimiento(valor);
                setMensaje('');
                setExitoso(false);
              }}
              required
            />
          </label>

          <label>
            CVV
            <input
              className="in"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={cvv}
              onChange={(e) => {
                setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                setMensaje('');
                setExitoso(false);
              }}
              required
            />
          </label>
        </div>

        <button className="btn p" type="submit">
          Pagar $80.000 COP
        </button>

        {mensaje && (
          <p
            className="msg"
            role="status"
            style={{ color: exitoso ? 'green' : undefined }}
          >
            {mensaje}
          </p>
        )}
      </form>
    </section>
  );
}