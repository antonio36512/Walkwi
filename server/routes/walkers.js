import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { location, minRating, maxPrice } = req.query;
    const filter = { role: 'walker' };

    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minRating) filter.rating = { $gte: Number(minRating) };
    if (maxPrice) filter.pricePerHour = { $lte: Number(maxPrice) };

    const walkers = await User.find(filter)
      .select('-password')
      .sort({ rating: -1 });

    return res.json(walkers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const walker = await User.findOne({ _id: req.params.id, role: 'walker' })
      .select('name profilePhotoUri location latitude longitude experience rating reviewCount pricePerHour verified bio availableDays availableHours completedWalks');

    if (!walker) {
      return res.status(404).json({ error: 'Paseador no encontrado.' });
    }

    return res.json(walker);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
