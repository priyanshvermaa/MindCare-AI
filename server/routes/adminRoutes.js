import express from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserProfile,
  updateAdminUserProfile,
  exportUsers,
  getAdminAnalytics,
  getAdminActivity,
  getAdminSettings,
  updateAdminSettings,
  toggleUserStatus,
  softDeleteUser,
  restoreDeletedUser
} from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT protect & admin role check middleware on all endpoints
router.use(protect);
router.use(authorizeRoles('admin'));

// Admin Dashboard stats summary (6 cards)
router.get('/dashboard', getAdminDashboard);

// Paged, searched, and sorted Users list
router.get('/users', getAdminUsers);

// Individual User details
router.get('/user/:id', getAdminUserProfile);

// Update user details or role/suspension state
router.patch('/user/:id', updateAdminUserProfile);
router.patch('/users/:id', updateAdminUserProfile);

// Export matched users
router.get('/export', exportUsers);

// Charts analytics data
router.get('/analytics', getAdminAnalytics);

// Audited recent platform activity feed
router.get('/activity', getAdminActivity);

// Get admin settings
router.get('/settings', getAdminSettings);

// Update admin settings
router.post('/settings', updateAdminSettings);

// Suspend / Unsuspend User
router.patch('/status/:id', toggleUserStatus);

// Soft Delete User
router.delete('/user/:id', softDeleteUser);

// Restore Soft-Deleted User
router.post('/restore/:id', restoreDeletedUser);

export default router;
