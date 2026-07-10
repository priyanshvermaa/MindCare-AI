import express from 'express';
import {
  sendMessageToAI,
  getConversations,
  getConversationById,
  deleteConversation
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with JWT bearer token checks
router.use(protect);

router.post('/chat', sendMessageToAI);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.delete('/conversations/:id', deleteConversation);

export default router;
