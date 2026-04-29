import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/auth/Login.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import StudentList from './pages/students/StudentList.jsx';
import StudentForm from './pages/students/StudentForm.jsx';
import StudentDetail from './pages/students/StudentDetail.jsx';
import TeacherList from './pages/teachers/TeacherList.jsx';
import TeacherForm from './pages/teachers/TeacherForm.jsx';
import ClassList from './pages/classes/ClassList.jsx';
import FeeList from './pages/fees/FeeList.jsx';
import Attendance from './pages/attendance/Attendance.jsx';
import ExamList from './pages/exams/ExamList.jsx';
import Reports from './pages/reports/Reports.jsx';
import Settings from './pages/settings/Settings.jsx';
import NoticeBoard from './pages/notices/NoticeBoard.jsx';

import StudentPortal from './pages/student-portal/StudentPortal.jsx';
import StudentDashboard from './pages/student-portal/StudentDashboard.jsx';
import StudentFees from './pages/student-portal/StudentFees.jsx';
import StudentAttendance from './pages/student-portal/StudentAttendance.jsx';
import StudentExams from './pages/student-portal/StudentExams.jsx';
import StudentChangePassword from './pages/student-portal/StudentChangePassword.jsx';
import StudentNotices from './pages/student-portal/StudentNotices.jsx';

import TeacherPortal from './pages/teacher-portal/TeacherPortal.jsx';
import TeacherDashboard from './pages/teacher-portal/TeacherDashboard.jsx';
import TeacherStudents from './pages/teacher-portal/TeacherStudents.jsx';
import TeacherAttendance from './pages/teacher-portal/TeacherAttendance.jsx';
import TeacherExams from './pages/teacher-portal/TeacherExams.jsx';
import TeacherChangePassword from './pages/teacher-portal/TeacherChangePassword.jsx';
import TeacherNotices from './pages/teacher-portal/TeacherNotices.jsx';

function ProtectedAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  return children;
}

function ProtectedStudent({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'student') return <Navigate to="/" replace />;
  return children;
}

function ProtectedTeacher({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'teacher') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Student Portal */}
      <Route path="/student" element={<ProtectedStudent><StudentPortal /></ProtectedStudent>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="exams" element={<StudentExams />} />
        <Route path="notices" element={<StudentNotices />} />
        <Route path="change-password" element={<StudentChangePassword />} />
      </Route>

      {/* Teacher Portal */}
      <Route path="/teacher" element={<ProtectedTeacher><TeacherPortal /></ProtectedTeacher>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="exams" element={<TeacherExams />} />
        <Route path="notices" element={<TeacherNotices />} />
        <Route path="change-password" element={<TeacherChangePassword />} />
      </Route>

      {/* Admin Portal */}
      <Route path="/" element={<ProtectedAdmin><Layout /></ProtectedAdmin>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<StudentList />} />
        <Route path="students/new" element={<StudentForm />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="students/:id/edit" element={<StudentForm />} />
        <Route path="teachers" element={<TeacherList />} />
        <Route path="teachers/new" element={<TeacherForm />} />
        <Route path="teachers/:id/edit" element={<TeacherForm />} />
        <Route path="classes" element={<ClassList />} />
        <Route path="fees" element={<FeeList />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="exams" element={<ExamList />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notices" element={<NoticeBoard />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
