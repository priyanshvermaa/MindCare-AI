import express from 'express';
import {
  createHabit,
  getHabits,
  toggleHabitCompletion,
  deleteHabit,
  getHabitStreakAnalytics
} from '../controllers/habitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createHabit);
router.get('/', getHabits);
router.get('/streak', getHabitStreakAnalytics);
router.put('/:id', toggleHabitCompletion);
router.delete('/:id', deleteHabit);

export default router;
