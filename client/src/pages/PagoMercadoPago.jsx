import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const formatoCOP = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor || 80000);

const estadoLegible = {
  authorized: 'Afiliación activa',
  pending: 'Pendiente de completar el pago',
  paused: 'Afiliación pausada',
  cancelled: 'Afiliación cancelada',
};

export default function PagoMercadoPago() {
  const [cargando, setCargando] = useState(false);
  const [consultando, setConsultando] = useState(true);
  const [afiliacion, setAfiliacion] = useState(null);
  const [error, setError] = useState('');

  async function consultarEstado() {
    setConsultando(true);
    setError('');

    try {
      const resultado = await api.estadoSuscripcion();
      setAfiliacion(resultado.afiliacion);
    } catch (e) {
      setError(e.message);
    } finally {
      setConsultando(false);
    }
  }

  useEffect(() => {
    consultarEstado();
  }, []);

  async function irAlPago() {
    setCargando(true);
    setError('');

    try {
      const resultado = await api.crearSuscripcion();
      window.location.assign(resultado.enlacePago);
    } catch (e) {
      setError(e.message);
      setCargando(false);
    }
  }

  return (
    <main className="page">
      <p className="tag">Afiliación para comercios</p>
      <h1>Visibilidad destacada</h1>
      <p className="sub">
        Afíliate para destacar tu comercio en Hidden Bogotá.
      </p>

      <section className="card payment-summary">
        <h2>{formatoCOP(afiliacion?.monto)} / mes</h2>
        <p>
          Pago mensual recurrente procesado de forma segura por Mercado Pago.
          Podrás elegir tu medio de pago en su página de checkout.
        </p>

        {consultando && <p>Consultando el estado de tu afiliación…</p>}

        {!consultando && afiliacion && (
          <div className="msg" role="status">
            <strong>
              {estadoLegible[afiliacion.estado] || afiliacion.estado}
            </strong>
            {afiliacion.siguientePago && (
              <p>
                Próximo cobro:{' '}
                {new Date(afiliacion.siguientePago).toLocaleDateString('es-CO')}
              </p>
            )}
          </div>
        )}

        {error && <p className="msg" role="alert">{error}</p>}

        {afiliacion?.estado !== 'authorized' && (
          <button
            className="btn p"
            type="button"
            onClick={irAlPago}
            disabled={cargando}
          >
            {cargando ? 'Conectando con Mercado Pago…' : 'Afiliarme y pagar'}
          </button>
        )}

        <button
          className="btn s"
          type="button"
          onClick={consultarEstado}
          disabled={consultando}
        >
          Actualizar estado
        </button>

        <p className="demo-note">
          El cobro se realiza en Mercado Pago. No ingreses los datos de tu
          tarjeta directamente en Hidden Bogotá.
        </p>
      </section>

      <p><Link to="/precios">Volver a planes y costos</Link></p>
    </main>
  );
}