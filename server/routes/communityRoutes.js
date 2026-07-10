import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  editPost,
  deletePost,
  toggleLike,
  toggleBookmark,
  addComment,
  deleteComment,
  getGroups,
  joinGroup,
  leaveGroup
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Community Posts
router.post('/posts', createPost);
router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', editPost);
router.delete('/posts/:id', deletePost);

// Comments
router.post('/comments', addComment);
router.delete('/comments/:id', deleteComment);

// Likes & Bookmarks
router.post('/like', toggleLike);
router.post('/bookmark', toggleBookmark);

// Support Groups
router.get('/groups', getGroups);
router.post('/groups/join', joinGroup);
router.post('/groups/leave', leaveGroup);

export default router;
