import asyncHandler from 'express-async-handler';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';
import { Exam } from '../models/Exam.js';
import Class from '../models/Class.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    newAdmissions,
    todayAttendance,
    pendingFeesAgg,
    monthRevenueAgg,
    upcomingExams,
    revenueTrend,
    attendanceTrend,
  ] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    Teacher.countDocuments({ status: 'active' }),
    Class.countDocuments(),
    Student.countDocuments({ admissionDate: { $gte: thirtyDaysAgo } }),

    Attendance.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Pending fees — current academic year only
    Fee.aggregate([
      { $match: { status: { $in: ['Unpaid', 'Partial'] }, academicYear: currentAcademicYear() } },
      { $group: { _id: null, total: { $sum: '$remainingBalance' } } },
    ]),

    // This month's collected revenue — current academic year, unwind payments subdocument
    Fee.aggregate([
      { $match: { academicYear: currentAcademicYear() } },
      { $unwind: '$payments' },
      { $match: { 'payments.paidDate': { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$payments.amount' } } },
    ]),

    Exam.find({ startDate: { $gte: today } })
      .sort({ startDate: 1 })
      .limit(5)
      .populate('class', 'name'),

    // Revenue trend — last 6 months, current academic year only
    Fee.aggregate([
      { $match: { academicYear: currentAcademicYear() } },
      { $unwind: '$payments' },
      { $match: { 'payments.paidDate': { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: '$payments.paidDate' }, m: { $month: '$payments.paidDate' } },
          revenue: { $sum: '$payments.amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),

    // Attendance trend last 7 days
    Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]),
  ]);

  res.json({
    totals: { students: totalStudents, teachers: totalTeachers, classes: totalClasses, newAdmissions },
    todayAttendance,
    pendingFees: pendingFeesAgg[0]?.total || 0,
    monthRevenue: monthRevenueAgg[0]?.total || 0,
    upcomingExams,
    revenueTrend,
    attendanceTrend,
  });
});
