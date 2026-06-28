import express from 'express';
import {
  reportCat,
  getCats,
  getCatById,
  getMapPins,
  updateCatStatus,
  analyzeImage,
} from '../controllers/catController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getCats);
router.get('/map/pins', getMapPins);
router.get('/:id', getCatById);

// Protected routes (require auth)
router.post('/', protect, upload.array('photos', 5), reportCat);
router.put('/:id/status', protect, updateCatStatus);

// AI analysis (protected — upload an image for instant AI severity check)
router.post('/analyze', protect, upload.array('photos', 1), analyzeImage);

export default router;
