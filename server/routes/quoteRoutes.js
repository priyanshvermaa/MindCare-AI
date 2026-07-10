import express from 'express';
import { getTodayQuote, getRandomQuote, seedQuotesCollection } from '../controllers/quoteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all quote routes
router.use(protect);

router.get('/today', getTodayQuote);
router.get('/random', getRandomQuote);
router.post('/seed', seedQuotesCollection);

export default router;
