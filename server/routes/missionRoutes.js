import express from 'express';
import {
  createMission,
  getMissions,
  claimMission,
  completeMission
} from '../controllers/missionController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .post(protect, createMission)
  .get(getMissions); // Can be public to view missions, or protected

router.put('/:id/claim', protect, claimMission);
router.put('/:id/complete', protect, upload.single('photo'), completeMission);

export default router;
