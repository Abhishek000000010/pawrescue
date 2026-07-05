import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserAvatar, becomeVolunteer, getNearbyFosters, getAdminStats, getAllUsers } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);
router.get('/fosters', getNearbyFosters);
router.put('/volunteer', protect, becomeVolunteer);
router.put('/me/avatar', protect, upload.single('avatar'), updateUserAvatar);
router.get('/admin/stats', protect, getAdminStats);
router.get('/admin/users', protect, getAllUsers);

export default router;
