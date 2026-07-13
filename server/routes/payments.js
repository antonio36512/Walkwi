import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';
import { createOrder, captureOrder, refundPayment } from '../services/paypal.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Sesion no autorizada.' });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesion expirada o invalida.' });
  }
}

router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Monto invalido.' });
    }

    const orderId = bookingId || `walkwi_${Date.now()}`;
    const order = await createOrder(amount, orderId);

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paypalOrderId: order.orderId,
        paymentAmount: Number(amount),
      });
    }

    return res.json(order);
  } catch (error) {
    console.error('PayPal create-order error:', error);
    return res.status(500).json({ error: 'Error al crear la orden de PayPal.' });
  }
});

router.post('/capture', authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido.' });
    }

    const result = await captureOrder(orderId);

    if (result.status === 'COMPLETED') {
      await Booking.findOneAndUpdate(
        { paypalOrderId: orderId },
        {
          paypalCaptureId: result.captureId,
          paymentStatus: 'captured',
        }
      );
    }

    return res.json(result);
  } catch (error) {
    console.error('PayPal capture error:', error);
    return res.status(500).json({ error: 'Error al capturar el pago.' });
  }
});

router.post('/refund', authenticate, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId es requerido.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (!booking.paypalCaptureId) {
      return res.status(400).json({ error: 'Esta reserva no tiene pago capturado para reembolsar.' });
    }

    const refundAmount = amount || booking.paymentAmount;
    const result = await refundPayment(booking.paypalCaptureId, refundAmount);

    if (result.status === 'COMPLETED') {
      const isPartial = Number(result.amount) < booking.paymentAmount;
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: isPartial ? 'partially_refunded' : 'refunded',
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('PayPal refund error:', error);
    return res.status(500).json({ error: 'Error al procesar el reembolso.' });
  }
});

router.get('/capture-return', async (req, res) => {
  const { orderId, token } = req.query;
  const paypalToken = token || orderId;

  if (!paypalToken) {
    return res.status(400).send(buildHtml('error', 'Parametros de pago invalidos.'));
  }

  try {
    const result = await captureOrder(paypalToken);

    if (result.status === 'COMPLETED') {
      await Booking.findOneAndUpdate(
        { paypalOrderId: paypalToken },
        {
          paypalCaptureId: result.captureId,
          paymentStatus: 'captured',
        }
      );
    }

    return res.send(buildHtml('success', 'Pago completado exitosamente.'));
  } catch (error) {
    console.error('PayPal capture-return error:', error);
    return res.send(buildHtml('success', 'Pago procesado. Puede volver a la app.'));
  }
});

router.get('/cancel', (req, res) => {
  res.send(buildHtml('cancel', 'Pago cancelado.'));
});

function buildHtml(status, message) {
  const bgColor = status === 'success' ? '#d4f1d8' : status === 'cancel' ? '#fef3c7' : '#fee2e2';
  const iconColor = status === 'success' ? '#10b981' : status === 'cancel' ? '#f59e0b' : '#ef4444';
  const icon = status === 'success' ? '&#10004;' : status === 'cancel' ? '&#10006;' : '&#9888;';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Walkwi - Pago</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f8faf9;">
  <div style="text-align:center;padding:40px;">
    <div style="width:80px;height:80px;border-radius:40px;background:${bgColor};display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
      <span style="font-size:36px;color:${iconColor};">${icon}</span>
    </div>
    <h1 style="color:#2d4a35;font-size:22px;margin:0 0 12px;">${message}</h1>
    <p style="color:#6b7b6f;font-size:15px;margin:0 0 32px;">Puede cerrar esta ventana y volver a la app.</p>
    <a href="walkwi://" style="display:inline-block;background:#3d8b5a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:16px;font-weight:800;font-size:16px;">Volver a Walkwi</a>
  </div>
  <script>setTimeout(function(){window.location.href='walkwi://';},2000);</script>
</body>
</html>`;
}

export default router;
