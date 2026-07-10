import express from 'express';
import {
  getDashboardStats,
  getChartData,
  logMood,
  logJournal,
  logWellness,
  logWater,
  getRecentActivity,
  seedUserData,
  getAIDashboardWellness,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protection middleware to all dashboard endpoints
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/charts', getChartData);
router.post('/mood', logMood);
router.post('/journal', logJournal);
router.post('/activity', logWellness);
router.post('/wellness', logWellness);
router.post('/water', logWater);
router.get('/activity', getRecentActivity);
router.post('/seed', seedUserData);
router.get('/ai-wellness', getAIDashboardWellness);

export default router;
