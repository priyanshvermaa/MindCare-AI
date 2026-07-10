import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getUserProfile, updateUserProfile, uploadProfilePicture, getAllUsers } from '../controllers/userController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import multer from 'multer';

const router = express.Router();

// GET /api/users
router.get('/', protect, getAllUsers);

// GET/PUT/PATCH /api/users/profile
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)
  .patch(protect, updateUserProfile);

// PUT /api/users/profile-picture
router.put('/profile-picture', protect, (req, res, next) => {
  upload.single('profilePicture')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Image size must be less than 2 MB.' });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, uploadProfilePicture);

export default router;
