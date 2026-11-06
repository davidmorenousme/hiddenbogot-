const crypto = require('crypto');

const PRECIO_MENSUAL = 80000;
const API_MP = 'https://api.mercadopago.com';

function registrarRutasPagos({ app, db, soloComercio, ruta }) {
  app.get('/api/pagos/config', (req, res) => {
    res.json({
      precio: PRECIO_MENSUAL,
      moneda: 'COP',
      frecuencia: 'mensual',
      pasarelaConfigurada: Boolean(process.env.MP_ACCESS_TOKEN),
    });
  });

  app.post('/api/pagos/suscripcion', soloComercio, ruta(async (req, res) => {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(503).json({
        error: 'Falta configurar MP_ACCESS_TOKEN en el archivo .env del servidor.',
      });
    }

    const [usuarios] = await db.query(
      'SELECT id, email FROM usuarios WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    const usuario = usuarios[0];

    if (!usuario || !usuario.email) {
      return res.status(400).json({
        error: 'No encontramos el correo de tu cuenta.',
      });
    }

    const referencia = `HB-${usuario.id}-${Date.now()}`;
    const frontendUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');

    const respuestaMP = await fetch(`${API_MP}/preapproval`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        reason: 'Afiliación mensual de comercio Hidden Bogotá',
        external_reference: referencia,
        payer_email: usuario.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: PRECIO_MENSUAL,
          currency_id: 'COP',
        },
        back_url: `${frontendUrl}/pago`,
        status: 'pending',
      }),
    });

    const suscripcion = await respuestaMP.json().catch(() => ({}));

    if (!respuestaMP.ok) {
      console.error('Error de Mercado Pago:', suscripcion);
      return res.status(502).json({
        error: suscripcion.message || 'Mercado Pago no pudo crear la afiliación.',
      });
    }

    if (!suscripcion.id || !suscripcion.init_point) {
      console.error('Respuesta incompleta de Mercado Pago:', suscripcion);
      return res.status(502).json({
        error: 'Mercado Pago no devolvió el enlace de pago.',
      });
    }

    await db.query(
      `INSERT INTO afiliaciones
        (usuario_id, mp_subscription_id, referencia, monto, moneda, estado)
       VALUES (?, ?, ?, ?, 'COP', ?)`,
      [
        usuario.id,
        String(suscripcion.id),
        referencia,
        PRECIO_MENSUAL,
        suscripcion.status || 'pending',
      ]
    );

    res.status(201).json({
      id: String(suscripcion.id),
      enlacePago: suscripcion.init_point,
      estado: suscripcion.status || 'pending',
    });
  }));

  app.get('/api/pagos/estado', soloComercio, ruta(async (req, res) => {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(503).json({
        error: 'Falta configurar MP_ACCESS_TOKEN en el archivo .env del servidor.',
      });
    }

    const [filas] = await db.query(
      `SELECT id, mp_subscription_id, monto, moneda, estado, siguiente_pago
       FROM afiliaciones
       WHERE usuario_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [req.user.id]
    );

    const afiliacion = filas[0];
    if (!afiliacion) {
      return res.json({ afiliacion: null });
    }

    const respuestaMP = await fetch(
      `${API_MP}/preapproval/${encodeURIComponent(afiliacion.mp_subscription_id)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const estadoMP = await respuestaMP.json().catch(() => ({}));

    if (!respuestaMP.ok) {
      console.error('Error consultando Mercado Pago:', estadoMP);
      return res.status(502).json({
        error: 'No pudimos verificar el estado con Mercado Pago.',
      });
    }

    const siguientePago = estadoMP.next_payment_date
      ? new Date(estadoMP.next_payment_date)
      : null;

    await db.query(
      `UPDATE afiliaciones
       SET estado = ?, siguiente_pago = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        estadoMP.status || afiliacion.estado,
        siguientePago && !Number.isNaN(siguientePago.getTime())
          ? siguientePago
          : null,
        afiliacion.id,
        req.user.id,
      ]
    );

    res.json({
      afiliacion: {
        monto: Number(estadoMP.auto_recurring?.transaction_amount || afiliacion.monto),
        moneda: estadoMP.auto_recurring?.currency_id || afiliacion.moneda,
        estado: estadoMP.status || afiliacion.estado,
        siguientePago: estadoMP.next_payment_date || null,
      },
    });
  }));
}

module.exports = registrarRutasPagos;