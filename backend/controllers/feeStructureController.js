import FeeStructure from '../models/FeeStructure.js';
import StudentFeeAssignment from '../models/StudentFeeAssignment.js';
import Student from '../models/Student.js';
import { calculateStudentFee } from '../utils/feeCalculator.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';

// ── Fee Structure CRUD ────────────────────────────────────────────────────────

export async function getStructures(req, res) {
  try {
    const { academicYear } = req.query;
    const year = academicYear || currentAcademicYear();
    const structures = await FeeStructure.find({ academicYear: year })
      .populate('class', 'name')
      .sort({ createdAt: -1 });
    res.json(structures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getStructureByClass(req, res) {
  try {
    const { classId } = req.params;
    const { academicYear } = req.query;
    const year = academicYear || currentAcademicYear();
    const structure = await FeeStructure.findOne({ class: classId, academicYear: year })
      .populate('class', 'name');
    if (!structure) return res.status(404).json({ message: 'No fee structure found for this class/year' });
    res.json(structure);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function upsertStructure(req, res) {
  try {
    const { classId, academicYear, name, components } = req.body;
    const year = academicYear || currentAcademicYear();

    const structure = await FeeStructure.findOneAndUpdate(
      { class: classId, academicYear: year },
      {
        class: classId,
        academicYear: year,
        name: name || '',
        components: components || [],
        isActive: true,
        lastModifiedBy: req.user._id,
        $setOnInsert: { createdBy: req.user._id },
      },
      { upsert: true, new: true, runValidators: true },
    );

    res.json(structure);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Structure already exists for this class/year' });
    res.status(500).json({ message: err.message });
  }
}

export async function deleteStructure(req, res) {
  try {
    const structure = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!structure) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ── Apply structure to students ───────────────────────────────────────────────

/**
 * POST /api/fee-structures/:id/apply
 * Creates a StudentFeeAssignment for every active student in the class,
 * skipping students who already have one for this academic year.
 * Query param: ?overwrite=true will update existing assignments.
 */
export async function applyToStudents(req, res) {
  try {
    const structure = await FeeStructure.findById(req.params.id);
    if (!structure) return res.status(404).json({ message: 'Structure not found' });

    const { overwrite = false } = req.query;
    const students = await Student.find({ class: structure.class, status: 'active' });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const student of students) {
      const existing = await StudentFeeAssignment.findOne({
        student: student._id,
        academicYear: structure.academicYear,
      });

      if (existing && !overwrite) { skipped++; continue; }

      const components = structure.components.map((c) => ({
        name:           c.name,
        baseAmount:     c.amount,
        frequency:      c.frequency,
        category:       c.category,
        isIncluded:     true,
        overrideAmount: null,
        overrideReason: '',
      }));

      const { summary } = calculateStudentFee(components, []);

      if (existing) {
        existing.components      = components;
        existing.adjustments     = [];
        existing.summary         = summary;
        existing.sourceStructure = structure._id;
        existing.lastModifiedBy  = req.user._id;
        await existing.save();
        updated++;
      } else {
        await StudentFeeAssignment.create({
          student:         student._id,
          class:           structure.class,
          academicYear:    structure.academicYear,
          sourceStructure: structure._id,
          components,
          adjustments:     [],
          summary,
          assignedBy:      req.user._id,
        });
        created++;
      }
    }

    res.json({ message: 'Done', created, updated, skipped, total: students.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ── Student Fee Assignment CRUD ───────────────────────────────────────────────

export async function getAssignments(req, res) {
  try {
    const { classId, studentId, academicYear } = req.query;
    const year = academicYear || currentAcademicYear();
    const filter = { academicYear: year };
    if (classId)   filter.class   = classId;
    if (studentId) filter.student = studentId;

    const assignments = await StudentFeeAssignment.find(filter)
      .populate('student', 'fullName studentId')
      .populate('class', 'name')
      .sort({ createdAt: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getAssignment(req, res) {
  try {
    const assignment = await StudentFeeAssignment.findById(req.params.id)
      .populate('student', 'fullName studentId section')
      .populate('class', 'name');
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateAssignment(req, res) {
  try {
    const assignment = await StudentFeeAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Not found' });

    const { components, adjustments } = req.body;
    if (components)  assignment.components  = components;
    if (adjustments !== undefined) assignment.adjustments = adjustments;

    const { summary } = calculateStudentFee(
      assignment.components,
      assignment.adjustments,
    );
    assignment.summary        = summary;
    assignment.lastModifiedBy = req.user._id;
    await assignment.save();
    await assignment.populate('student', 'fullName studentId');
    await assignment.populate('class', 'name');

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteAssignment(req, res) {
  try {
    const assignment = await StudentFeeAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
