import express from 'express';
import {
  createMission,
  getMissions,
  claimMission,
  completeMission,
  approveMission,
  rejectMission
} from '../controllers/missionController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .post(protect, createMission)
  .get(getMissions);

router.put('/:id/claim', protect, claimMission);
router.put('/:id/complete', protect, upload.single('photo'), completeMission);
router.put('/:id/approve', protect, approveMission);
router.put('/:id/reject', protect, rejectMission);

export default router;
