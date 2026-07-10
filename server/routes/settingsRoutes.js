import express from 'express';
import { getSettings, updateSettings, changePassword, deleteAccount } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All settings routes are protected
router.use(protect);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/change-password', changePassword);
router.delete('/delete-account', deleteAccount);

export default router;
