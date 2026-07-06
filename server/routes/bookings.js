import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

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

const VALID_TRANSITIONS = {
  walker: {
    pending: ['accepted', 'cancelled'],
    accepted: ['completed'],
  },
  user: {
    pending: ['cancelled'],
    accepted: ['cancelled'],
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

    const walkerUser = await User.findOne({ _id: walkerId, role: 'walker' });
    if (!walkerUser) {
      return res.status(404).json({ error: 'Paseador no encontrado.' });
    }

    const booking = await Booking.create({
      client: userId,
      walker: walkerId,
      petName,
      petId: petId || null,
      startTime: new Date(startTime),
      duration,
      location: {
        address,
        latitude: latitude != null ? Number(latitude) : undefined,
        longitude: longitude != null ? Number(longitude) : undefined,
      },
      notes: notes || '',
      price: Number(price) || 0,
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
      .populate('client', 'name email profilePhotoUri phone')
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
      status: 'accepted',
      startTime: { $gte: new Date() },
    };

    if (role === 'user') {
      filter.client = userId;
    } else {
      filter.walker = userId;
    }

    const booking = await Booking.findOne(filter)
      .populate('client', 'name email profilePhotoUri')
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
      .populate('client', 'name email profilePhotoUri phone')
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

    booking.status = newStatus;
    if (newStatus === 'cancelled') {
      booking.cancelReason = cancelReason;
    }

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('client', 'name email profilePhotoUri phone')
      .populate('walker', 'name email profilePhotoUri phone location rating pricePerHour');

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
