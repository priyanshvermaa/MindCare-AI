import express from 'express';
import {
  createMood,
  getMoods,
  getMoodById,
  updateMood,
  deleteMood,
  getMoodAnalytics,
  getMoodStreak,
} from '../controllers/moodController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.post('/', createMood);
router.get('/', getMoods);
router.get('/analytics', getMoodAnalytics);
router.get('/streak', getMoodStreak);
router.get('/:id', getMoodById);
router.put('/:id', updateMood);
router.delete('/:id', deleteMood);

export default router;
