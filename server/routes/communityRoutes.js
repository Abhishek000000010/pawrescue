import express from 'express';
import { getPosts, createPost, likePost, addComment, deletePost } from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getPosts)
  .post(protect, upload.single('image'), createPost);

router.put('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deletePost);

export default router;
