import express from 'express';
import { 
  getResources, 
  getResourceById, 
  updateResourceProgress 
} from '../controllers/resourceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.get('/', getResources);
router.get('/:id', getResourceById);
router.post('/:id/progress', updateResourceProgress);

export default router;
