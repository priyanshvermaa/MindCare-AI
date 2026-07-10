import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .patch(protect, updateUserProfile);

export default router;
