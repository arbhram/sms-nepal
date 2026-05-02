import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getParents, createParent, updateParent, deleteParent, resetParentPassword } from '../controllers/parentController.js';

const router = express.Router();
router.use(protect, authorize('superadmin', 'admin'));

router.get('/', getParents);
router.post('/', createParent);
router.put('/:id', updateParent);
router.delete('/:id', deleteParent);
router.post('/:id/reset-password', resetParentPassword);

export default router;
