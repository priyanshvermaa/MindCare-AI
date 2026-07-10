import express from 'express';
import {
  getEmergencyData
} from '../controllers/emergencyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getEmergencyData);

export default router;
