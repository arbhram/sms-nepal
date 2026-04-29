import asyncHandler from 'express-async-handler';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';
import { Exam } from '../models/Exam.js';
import Class from '../models/Class.js';

// @desc   Dashboard widget data
// @route  GET /api/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    newAdmissions,
    todayAttendance,
    pendingFeesAgg,
    monthRevenueAgg,
    upcomingExams,
  ] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    Teacher.countDocuments({ status: 'active' }),
    Class.countDocuments(),
    Student.countDocuments({ admissionDate: { $gte: thirtyDaysAgo } }),
    Attendance.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Fee.aggregate([
      { $match: { status: { $in: ['Pending', 'Partial', 'Overdue'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } },
    ]),
    Fee.aggregate([
      { $match: { paidDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    Exam.find({ startDate: { $gte: today } }).sort({ startDate: 1 }).limit(5).populate('class', 'name'),
  ]);

  // Revenue per month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const revenueTrend = await Fee.aggregate([
    { $match: { paidDate: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { y: { $year: '$paidDate' }, m: { $month: '$paidDate' } },
        revenue: { $sum: '$paidAmount' },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  // Attendance trend (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const attendanceTrend = await Attendance.aggregate([
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
  ]);

  res.json({
    totals: {
      students: totalStudents,
      teachers: totalTeachers,
      classes: totalClasses,
      newAdmissions,
    },
    todayAttendance,
    pendingFees: pendingFeesAgg[0]?.total || 0,
    monthRevenue: monthRevenueAgg[0]?.total || 0,
    upcomingExams,
    revenueTrend,
    attendanceTrend,
  });
});
