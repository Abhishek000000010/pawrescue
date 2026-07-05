import express from 'express';
import { submitInquiry, getMyInquiries, getAllInquiries, updateInquiryStatus } from '../controllers/adoptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/inquire', submitInquiry);
router.get('/my-inquiries', protect, getMyInquiries);
router.get('/all', protect, getAllInquiries);
router.put('/:id/status', protect, updateInquiryStatus);

export default router;
