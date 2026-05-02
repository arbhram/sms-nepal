import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getReportCard, getGradebook } from '../controllers/reportCardController.js';

const router = express.Router();

router.use(protect);

router.get('/gradebook', getGradebook);
router.get('/student/:studentId', getReportCard);

export default router;
