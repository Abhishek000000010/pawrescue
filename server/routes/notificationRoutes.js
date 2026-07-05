import express from 'express';
import { getAdminNotifications, markNotificationsAsRead } from '../controllers/notificationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Both routes are protected for admin only
router.get('/', protect, adminOnly, getAdminNotifications);
router.put('/read', protect, adminOnly, markNotificationsAsRead);

export default router;
