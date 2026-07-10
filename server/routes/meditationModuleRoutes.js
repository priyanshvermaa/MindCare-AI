import express from 'express';
import {
  getCategories,
  getCategoryBySlug,
  getArticlesByCategory,
  getArticleById,
  getVideosByCategory,
  getVideoById,
  updateReadingProgress,
  updateWatchHistory,
  getMeditationStats
} from '../controllers/meditationModuleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware
router.use(protect);

router.get('/categories', getCategories);
router.get('/category/:slug', getCategoryBySlug);
router.get('/articles/:slug', getArticlesByCategory);
router.get('/article/:id', getArticleById);
router.get('/videos/:slug', getVideosByCategory);
router.get('/video/:id', getVideoById);
router.post('/reading-progress', updateReadingProgress);
router.post('/watch-history', updateWatchHistory);
router.get('/stats', getMeditationStats);

export default router;
