import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getStructures,
  getStructureByClass,
  upsertStructure,
  deleteStructure,
  applyToStudents,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
} from '../controllers/feeStructureController.js';

const router = express.Router();
const admin  = authorize('superadmin', 'admin');

// Fee structures
router.get ('/',                  protect, admin, getStructures);
router.get ('/class/:classId',    protect, admin, getStructureByClass);
router.post('/upsert',            protect, admin, upsertStructure);
router.delete('/:id',             protect, admin, deleteStructure);
router.post ('/:id/apply',        protect, admin, applyToStudents);

// Student assignments
router.get ('/assignments',       protect, admin, getAssignments);
router.get ('/assignments/:id',   protect, admin, getAssignment);
router.put ('/assignments/:id',   protect, admin, updateAssignment);
router.delete('/assignments/:id', protect, admin, deleteAssignment);

export default router;
