import express from 'express';
import {
  getStats,
  getUsers,
  getCats,
  getAdoptions,
  updateAdoptionStatus,
  getFosters,
  getDonations,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Every admin route requires a logged-in admin.
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/cats', getCats);
router.get('/adoptions', getAdoptions);
router.put('/adoptions/:id/status', updateAdoptionStatus);
router.get('/fosters', getFosters);
router.get('/donations', getDonations);

export default router;
