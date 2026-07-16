import { Router } from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/walker/:walkerId', async (req, res) => {
  try {
    const reviews = await Review.find({ walker: req.params.walkerId })
      .populate('client', 'name profilePhotoUri')
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json(reviews);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/booking/:bookingId', authenticate, async (req, res) => {
  try {
    const review = await Review.findOne({ booking: req.params.bookingId, client: req.auth.userId });
    return res.json(review || null);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ error: 'Faltan campos requeridos: bookingId, rating.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'La calificacion debe ser entre 1 y 5.' });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      client: userId,
      status: 'completed',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada o no completada.' });
    }

    const existing = await Review.findOne({ booking: bookingId });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una calificacion para esta reserva.' });
    }

    const review = await Review.create({
      booking: bookingId,
      client: userId,
      walker: booking.walker,
      rating: Number(rating),
      comment: comment || '',
    });

    const agg = await Review.aggregate([
      { $match: { walker: booking.walker } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (agg.length > 0) {
      await User.findByIdAndUpdate(booking.walker, {
        rating: Math.round(agg[0].avg * 10) / 10,
        reviewCount: agg[0].count,
      });
    }

    return res.status(201).json(review);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
