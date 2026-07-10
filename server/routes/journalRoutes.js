import express from 'express';
import {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  restoreJournal,
  toggleFavorite,
  togglePin,
  generateSummary,
  detectTone,
  getReflectionQuestions,
  getInsights,
  getWeeklyReflection,
  getJournalAnalytics,
} from '../controllers/journalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply JWT protect to all journal routes
router.use(protect);

// Static routes BEFORE parameterized routes
router.get('/analytics', getJournalAnalytics);
router.get('/weekly-reflection', getWeeklyReflection);

// CRUD
router.post('/', createJournal);
router.get('/', getJournals);
router.get('/:id', getJournalById);
router.put('/:id', updateJournal);
router.delete('/:id', deleteJournal);

// Toggle actions
router.patch('/:id/restore', restoreJournal);
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/pin', togglePin);

// AI endpoints
router.post('/:id/ai/summary', generateSummary);
router.post('/:id/ai/tone', detectTone);
router.post('/:id/ai/reflect', getReflectionQuestions);
router.post('/:id/ai/insights', getInsights);

export default router;
