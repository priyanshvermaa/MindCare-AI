import express from 'express';
import {
  addWater,
  getTodayWater,
  getWaterHistory,
  getWeeklyWater,
  getMonthlyWater,
  getWaterStats,
  updateWater,
  deleteWater,
  resetTodayWater,
  setDailyGoal,
  getWaterTelemetry,
} from '../controllers/waterController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with JWT token checks
router.use(protect);

router.post('/add', addWater);
router.get('/today', getTodayWater);
router.get('/history', getWaterHistory);
router.get('/weekly', getWeeklyWater);
router.get('/monthly', getMonthlyWater);
router.get('/stats', getWaterStats);
router.get('/telemetry', getWaterTelemetry);
router.patch('/update/:id', updateWater);
router.delete('/delete/:id', deleteWater);
router.post('/reset', resetTodayWater);
router.post('/goal', setDailyGoal);

export default router;
