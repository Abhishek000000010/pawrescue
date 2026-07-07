import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, updateUserAvatar, becomeVolunteer, getNearbyFosters, getAdminStats, getAllUsers, updatePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);
router.put('/me/password', protect, updatePassword);
router.get('/fosters', getNearbyFosters);
router.put('/volunteer', protect, becomeVolunteer);
router.put('/me/avatar', protect, upload.single('avatar'), updateUserAvatar);
router.get('/admin/stats', protect, getAdminStats);
router.get('/admin/users', protect, getAllUsers);

export default router;
