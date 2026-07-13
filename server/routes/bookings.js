import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { captureOrder, refundPayment } from '../services/paypal.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

function calculatePrice(duration) {
  const d = Math.max(30, Math.min(120, Number(duration) || 30));
  return Math.round((6 + ((d - 30) / 90) * 9) * 100) / 100;
}

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

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const VALID_TRANSITIONS = {
  walker: {
    pending: ['accepted', 'cancelled'],
    accepted: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
  },
  user: {
    pending: ['cancelled'],
    accepted: ['cancelled'],
    in_progress: ['cancelled'],
  },
};

function canTransition(role, currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[role]?.[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const role = req.auth.role;

    if (role !== 'user') {
      return res.status(403).json({ error: 'Solo los clientes pueden crear reservas.' });
    }

    const { walkerId, petName, petId, startTime, duration, address, latitude, longitude, notes, price } = req.body;

    if (!walkerId || !petName || !startTime || !duration || !address) {
      return res.status(400).json({ error: 'Faltan campos requeridos: walkerId, petName, startTime, duration, address.' });
    }

    const startDateTime = new Date(startTime);
    if (isNaN(startDateTime.getTime()) || startDateTime <= new Date()) {
      return res.status(400).json({ error: 'La fecha y hora del paseo debe ser en el futuro.' });
    }

    const walkerUser = await User.findOne({ _id: walkerId, role: 'walker' });
    if (!walkerUser) {
      return res.status(404).json({ error: 'Paseador no encontrado.' });
    }

    const activeBooking = await Booking.findOne({
      client: userId,
      status: { $in: ['accepted', 'in_progress'] },
    });
    if (activeBooking) {
      return res.status(409).json({ error: 'Ya tienes un paseo activo. Debes completar o cancelar el paseo actual antes de reservar otro.' });
    }

    const booking = await Booking.create({
      client: userId,
      walker: walkerId,
      petName,
      petId: petId || null,
      startTime: startDateTime,
      duration,
      location: {
        address,
        latitude: latitude != null ? Number(latitude) : undefined,
        longitude: longitude != null ? Number(longitude) : undefined,
      },
      notes: notes || '',
      price: Number(price) || calculatePrice(duration),
    });

    return res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const role = req.auth.role;
    const { status, petId } = req.query;

    const filter = {};
    if (role === 'user') {
      filter.client = userId;
    } else {
      filter.walker = userId;
    }

    if (status) filter.status = status;
    if (petId) filter.petId = petId;

    const bookings = await Booking.find(filter)
      .populate('client', 'name email profilePhotoUri phone latitude longitude')
      .populate('walker', 'name email profilePhotoUri phone location rating pricePerHour')
      .sort({ startTime: 1 });

    return res.json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/me/upcoming', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const role = req.auth.role;

    const filter = {
      status: { $in: ['accepted', 'in_progress'] },
      startTime: { $gte: new Date() },
    };

    if (role === 'user') {
      filter.client = userId;
    } else {
      filter.walker = userId;
    }

    const booking = await Booking.findOne(filter)
      .populate('client', 'name email profilePhotoUri phone latitude longitude')
      .populate('walker', 'name email profilePhotoUri')
      .sort({ startTime: 1 });

    return res.json(booking || null);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/slots', authenticate, async (req, res) => {
  try {
    const { walkerId, date } = req.query;
    if (!walkerId || !date) {
      return res.status(400).json({ error: 'walkerId y date son requeridos.' });
    }

    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd = new Date(date + 'T23:59:59');

    const bookings = await Booking.find({
      walker: walkerId,
      startTime: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled'] },
    }).select('startTime duration status');

    const slots = bookings.map((b) => ({
      startTime: b.startTime,
      duration: b.duration,
      status: b.status,
    }));

    return res.json(slots);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'name email profilePhotoUri phone latitude longitude')
      .populate('walker', 'name email profilePhotoUri phone location rating pricePerHour');

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    const isClient = booking.client._id.toString() === userId;
    const isWalker = booking.walker._id.toString() === userId;

    if (!isClient && !isWalker) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    return res.json(booking);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/:id/verify', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const role = req.auth.role;
    const { code } = req.body;

    if (role !== 'walker') {
      return res.status(403).json({ error: 'Solo los paseadores pueden verificar codigos.' });
    }

    if (!code || !String(code).trim()) {
      return res.status(400).json({ error: 'Debes ingresar un codigo.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (booking.walker.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    const trimmedCode = String(code).trim();

    if (booking.status === 'accepted') {
      if (trimmedCode !== booking.startCode) {
        return res.status(400).json({ error: 'Codigo de inicio incorrecto.' });
      }
      booking.status = 'in_progress';
    } else if (booking.status === 'in_progress') {
      if (trimmedCode !== booking.endCode) {
        return res.status(400).json({ error: 'Codigo de entrega incorrecto.' });
      }
      booking.status = 'completed';
    } else {
      return res.status(400).json({ error: `No se puede verificar una reserva en estado "${booking.status}".` });
    }

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('client', 'name email profilePhotoUri phone latitude longitude')
      .populate('walker', 'name email profilePhotoUri phone location rating pricePerHour');

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const role = req.auth.role;
    const { status: newStatus, cancelReason } = req.body;

    if (!newStatus) {
      return res.status(400).json({ error: 'El campo status es requerido.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    const isClient = booking.client.toString() === userId;
    const isWalker = booking.walker.toString() === userId;

    if (!isClient && !isWalker) {
      return res.status(403).json({ error: 'No puedes modificar esta reserva.' });
    }

    const userRole = isWalker ? 'walker' : 'user';

    if (!canTransition(userRole, booking.status, newStatus)) {
      return res.status(400).json({
        error: `No puedes cambiar de "${booking.status}" a "${newStatus}".`,
      });
    }

    if (newStatus === 'cancelled' && !cancelReason) {
      return res.status(400).json({ error: 'Debes indicar un motivo de cancelación.' });
    }

    const originalStatus = booking.status;

    booking.status = newStatus;
    if (newStatus === 'cancelled') {
      booking.cancelReason = cancelReason;

      if (booking.paypalOrderId && booking.paymentAmount > 0) {
        try {
          if (userRole === 'walker') {
            if (booking.paypalCaptureId) {
              await refundPayment(booking.paypalCaptureId, booking.paymentAmount);
              booking.paymentStatus = 'refunded';
            }
          } else {
            if (originalStatus === 'pending' || originalStatus === 'accepted') {
              const penaltyAmount = Math.round(booking.paymentAmount * 0.5 * 100) / 100;
              if (booking.paypalCaptureId) {
                const refundAmount = booking.paymentAmount - penaltyAmount;
                if (refundAmount > 0) {
                  await refundPayment(booking.paypalCaptureId, refundAmount);
                  booking.paymentStatus = 'partially_refunded';
                } else {
                  await refundPayment(booking.paypalCaptureId, booking.paymentAmount);
                  booking.paymentStatus = 'refunded';
                }
              }
            } else if (originalStatus === 'in_progress') {
              if (booking.paypalCaptureId) {
                await refundPayment(booking.paypalCaptureId, booking.paymentAmount);
                booking.paymentStatus = 'refunded';
              }
            }
          }
        } catch (payErr) {
          console.error('PayPal cancel payment error:', payErr);
        }
      }
    }

    if (newStatus === 'accepted') {
      booking.startCode = generateCode();
      booking.endCode = generateCode();
    }

    if (newStatus === 'completed' && booking.paypalOrderId && booking.paymentStatus === 'pending') {
      try {
        const captureResult = await captureOrder(booking.paypalOrderId);
        if (captureResult.status === 'COMPLETED') {
          booking.paypalCaptureId = captureResult.captureId;
          booking.paymentStatus = 'captured';
        }
      } catch (payErr) {
        console.error('PayPal capture error on complete:', payErr);
      }
    }

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('client', 'name email profilePhotoUri phone latitude longitude')
      .populate('walker', 'name email profilePhotoUri phone location rating pricePerHour');

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/:id/location', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const role = req.auth.role;
    const { latitude, longitude } = req.body;

    if (role !== 'walker') {
      return res.status(403).json({ error: 'Solo los paseadores pueden enviar ubicacion.' });
    }

    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'latitude y longitude son requeridos.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (booking.walker.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    if (booking.status !== 'in_progress') {
      return res.status(400).json({ error: 'Solo se puede rastrear una reserva en progreso.' });
    }

    const now = new Date();
    booking.tracking = booking.tracking || {};
    booking.tracking.current = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      timestamp: now,
    };

    if (!booking.tracking.history) {
      booking.tracking.history = [];
    }
    booking.tracking.history.push({
      latitude: Number(latitude),
      longitude: Number(longitude),
      timestamp: now,
    });

    if (booking.tracking.history.length > 500) {
      booking.tracking.history = booking.tracking.history.slice(-500);
    }

    await booking.save();

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/:id/location', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const booking = await Booking.findById(req.params.id)
      .select('tracking client walker status');

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    const isClient = booking.client.toString() === userId;
    const isWalker = booking.walker.toString() === userId;

    if (!isClient && !isWalker) {
      return res.status(403).json({ error: 'No tienes acceso a esta reserva.' });
    }

    return res.json({
      status: booking.status,
      tracking: booking.tracking || { current: null, history: [] },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
