import asyncHandler from 'express-async-handler';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

export const createClass = asyncHandler(async (req, res) => {
  const cls = await Class.create(req.body);
  res.status(201).json(cls);
});

export const getClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find().populate('classTeacher', 'fullName').sort({ name: 1 });
  // Attach student count per class
  const withCounts = await Promise.all(
    classes.map(async (c) => {
      const count = await Student.countDocuments({ class: c._id, status: 'active' });
      return { ...c.toObject(), studentCount: count };
    })
  );
  res.json(withCounts);
});

export const getClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id).populate('classTeacher');
  if (!cls) {
    res.status(404);
    throw new Error('Class not found');
  }
  res.json(cls);
});

export const updateClass = asyncHandler(async (req, res) => {
  const previous = await Class.findById(req.params.id);
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cls) {
    res.status(404);
    throw new Error('Class not found');
  }

  const prevTeacher = previous?.classTeacher?.toString();
  const newTeacher = cls.classTeacher?.toString();

  // Remove class from previous class teacher's assignedClasses
  if (prevTeacher && prevTeacher !== newTeacher) {
    await Teacher.findByIdAndUpdate(prevTeacher, { $pull: { assignedClasses: cls._id } });
  }
  // Add class to new class teacher's assignedClasses
  if (newTeacher) {
    await Teacher.findByIdAndUpdate(newTeacher, { $addToSet: { assignedClasses: cls._id } });
  }

  res.json(cls);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const inUse = await Student.countDocuments({ class: req.params.id });
  if (inUse > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${inUse} students are in this class`);
  }
  await Class.findByIdAndDelete(req.params.id);
  res.json({ message: 'Class removed' });
});
