import express from 'express';
import {
  getDashboardAnalyticsData,
  getMoodAnalyticsData,
  getJournalAnalyticsData,
  getStreakData
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply JWT verification checks to all requests
router.use(protect);

router.get('/dashboard', getDashboardAnalyticsData);
router.get('/moods', getMoodAnalyticsData);
router.get('/journal', getJournalAnalyticsData);
router.get('/streak', getStreakData);

export default router;
