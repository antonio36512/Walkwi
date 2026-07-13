import { Router } from 'express';
import User from '../models/User.js';
import Review from '../models/Review.js';

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

    const walkerIds = walkers.map((w) => w._id);
    const reviewCounts = await Review.aggregate([
      { $match: { walker: { $in: walkerIds } } },
      { $group: { _id: '$walker', count: { $sum: 1 }, avg: { $avg: '$rating' } } },
    ]);

    const reviewMap = {};
    reviewCounts.forEach((r) => {
      reviewMap[r._id.toString()] = { count: r.count, avg: Math.round(r.avg * 10) / 10 };
    });

    const enriched = walkers.map((w) => {
      const data = w.toObject();
      const rv = reviewMap[data._id.toString()];
      if (rv) {
        data.reviewCount = rv.count;
        data.rating = rv.avg;
      }
      return data;
    });

    return res.json(enriched);
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

    const reviewStats = await Review.aggregate([
      { $match: { walker: walker._id } },
      { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
    ]);

    const data = walker.toObject();
    if (reviewStats.length > 0) {
      data.reviewCount = reviewStats[0].count;
      data.rating = Math.round(reviewStats[0].avg * 10) / 10;
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
