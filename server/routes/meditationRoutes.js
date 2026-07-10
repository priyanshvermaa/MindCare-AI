import express from 'express';
import {
  getMeditations,
  getFeaturedMeditation,
  getUserMeditationStats,
  getRecommendations,
  getMotivationQuote,
  getResumeSessions,
  playMeditation,
  saveProgress,
  // admin
  createMeditation,
  updateMeditation,
  deleteMeditation,
  getAdminStats,
  getAdminQuotes,
  createQuote,
  updateQuote,
  deleteQuote
} from '../controllers/meditationController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// User routes
router.get('/', getMeditations);
router.get('/featured', getFeaturedMeditation);
router.get('/stats', getUserMeditationStats);
router.get('/recommendations', getRecommendations);
router.get('/motivation', getMotivationQuote);
router.get('/recently-played', getResumeSessions);

router.post('/:id/play', playMeditation);
router.post('/:id/progress', saveProgress);

// Admin routes
router.get('/admin/stats', authorizeRoles('admin'), getAdminStats);
router.get('/admin/quotes', authorizeRoles('admin'), getAdminQuotes);
router.post('/admin/quotes', authorizeRoles('admin'), createQuote);
router.put('/admin/quotes/:id', authorizeRoles('admin'), updateQuote);
router.delete('/admin/quotes/:id', authorizeRoles('admin'), deleteQuote);

router.post('/admin', authorizeRoles('admin'), createMeditation);
router.put('/admin/:id', authorizeRoles('admin'), updateMeditation);
router.delete('/admin/:id', authorizeRoles('admin'), deleteMeditation);

export default router;
