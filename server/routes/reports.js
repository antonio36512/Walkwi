import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Report from '../models/Report.js';
import Booking from '../models/Booking.js';

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

function adminOnly(req, res, next) {
  if (req.auth.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
}

router.post('/', authenticate, async (req, res) => {
  try {
    const reporterId = req.auth.userId;
    const { bookingId, reason, description } = req.body;

    if (!bookingId || !reason || !description) {
      return res.status(400).json({ error: 'Faltan campos requeridos: bookingId, reason, description.' });
    }

    if (reason !== 'otro' && !['mal_servicio', 'conducta_inapropiada', 'no_se_presento', 'maltrato_animal'].includes(reason)) {
      return res.status(400).json({ error: 'Motivo de reporte invalido.' });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({ error: 'La descripcion debe tener al menos 10 caracteres.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Solo se pueden reportar reservas completadas.' });
    }

    const reporterStr = reporterId.toString();
    const clientStr = booking.client.toString();
    const walkerStr = booking.walker.toString();

    if (reporterStr !== clientStr && reporterStr !== walkerStr) {
      return res.status(403).json({ error: 'No participaste en esta reserva.' });
    }

    const reportedId = reporterStr === clientStr ? booking.walker : booking.client;

    const existing = await Report.findOne({ reporter: reporterId, booking: bookingId });
    if (existing) {
      return res.status(409).json({ error: 'Ya has reportado esta reserva anteriormente.' });
    }

    const report = await Report.create({
      reporter: reporterId,
      reported: reportedId,
      booking: bookingId,
      reason,
      description: description.trim(),
    });

    res.status(201).json(report);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ya has reportado esta reserva anteriormente.' });
    }
    console.error('Error al crear reporte:', err);
    res.status(500).json({ error: 'Error al crear el reporte.' });
  }
});

router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['pending', 'reviewed', 'dismissed', 'action_taken'].includes(status)) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reporter', 'name email role')
      .populate('reported', 'name email role')
      .populate('booking', 'startTime petName status')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error('Error al obtener reportes:', err);
    res.status(500).json({ error: 'Error al obtener los reportes.' });
  }
});

router.get('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email role profilePhotoUri')
      .populate('reported', 'name email role profilePhotoUri')
      .populate('booking');

    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado.' });
    }

    res.json(report);
  } catch (err) {
    console.error('Error al obtener reporte:', err);
    res.status(500).json({ error: 'Error al obtener el reporte.' });
  }
});

router.patch('/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'reviewed', 'dismissed', 'action_taken'].includes(status)) {
      return res.status(400).json({ error: 'Estado invalido.' });
    }

    const update = { status };
    if (adminNotes !== undefined) {
      update.adminNotes = adminNotes.trim();
    }

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado.' });
    }

    res.json(report);
  } catch (err) {
    console.error('Error al actualizar reporte:', err);
    res.status(500).json({ error: 'Error al actualizar el reporte.' });
  }
});

export default router;
