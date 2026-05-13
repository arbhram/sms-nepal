import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { SchoolProvider } from './context/SchoolContext.jsx';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin.jsx';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';
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
import ParentList from './pages/parents/ParentList.jsx';
import Finance from './pages/finance/Finance.jsx';
import Gradebook from './pages/exams/Gradebook.jsx';
import ChartOfAccounts from './pages/accounting/ChartOfAccounts.jsx';
import Journals from './pages/accounting/Journals.jsx';
import TrialBalance from './pages/accounting/TrialBalance.jsx';
import FinancialReports from './pages/accounting/FinancialReports.jsx';
import Ledger from './pages/accounting/Ledger.jsx';
import PayrollList from './pages/payroll/PayrollList.jsx';
import PayrollDetail from './pages/payroll/PayrollDetail.jsx';
import FeeStructures from './pages/fees/FeeStructures.jsx';
import StudentFeeAssignments from './pages/fees/StudentFeeAssignments.jsx';
import TeacherGradebook from './pages/teacher-portal/TeacherGradebook.jsx';
import ParentReportCard from './pages/parent-portal/ParentReportCard.jsx';
import StudentReportCard from './pages/student-portal/StudentReportCard.jsx';

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

import ParentPortal from './pages/parent-portal/ParentPortal.jsx';
import ParentDashboard from './pages/parent-portal/ParentDashboard.jsx';
import ParentFees from './pages/parent-portal/ParentFees.jsx';
import ParentAttendance from './pages/parent-portal/ParentAttendance.jsx';
import ParentExams from './pages/parent-portal/ParentExams.jsx';
import ParentNotices from './pages/parent-portal/ParentNotices.jsx';
import ParentChangePassword from './pages/parent-portal/ParentChangePassword.jsx';

function ProtectedAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'parent') return <Navigate to="/parent/dashboard" replace />;
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

function ProtectedParent({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'parent') return <Navigate to="/" replace />;
  return children;
}

// Redirect to /superadmin/login if not authenticated
function ProtectedSuperAdmin({ children }) {
  const token = localStorage.getItem('superAdminToken');
  if (!token) return <Navigate to="/superadmin/login" replace />;
  return children;
}

export default function App() {
  // Super admin subdomain: skip SchoolProvider, show console UI
  const isSuperAdmin = window.location.hostname.startsWith('admin.');

  if (isSuperAdmin) {
    return (
      <Routes>
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        <Route path="/superadmin/dashboard" element={<ProtectedSuperAdmin><SuperAdminDashboard /></ProtectedSuperAdmin>} />
        <Route path="*" element={<Navigate to="/superadmin/login" replace />} />
      </Routes>
    );
  }

  return (
    <SchoolProvider>
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
        <Route path="report-card" element={<StudentReportCard />} />
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
        <Route path="gradebook" element={<TeacherGradebook />} />
        <Route path="change-password" element={<TeacherChangePassword />} />
      </Route>

      {/* Parent Portal */}
      <Route path="/parent" element={<ProtectedParent><ParentPortal /></ProtectedParent>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="fees" element={<ParentFees />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="exams" element={<ParentExams />} />
        <Route path="notices" element={<ParentNotices />} />
        <Route path="report-card" element={<ParentReportCard />} />
        <Route path="change-password" element={<ParentChangePassword />} />
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
        <Route path="parents" element={<ParentList />} />
        <Route path="finance" element={<Finance />} />
        <Route path="gradebook" element={<Gradebook />} />
        <Route path="fees/structures" element={<FeeStructures />} />
        <Route path="fees/assignments" element={<StudentFeeAssignments />} />
        <Route path="settings" element={<Settings />} />
        <Route path="payroll"     element={<PayrollList />} />
        <Route path="payroll/:id" element={<PayrollDetail />} />
        <Route path="accounting/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="accounting/journals"           element={<Journals />} />
        <Route path="accounting/trial-balance"      element={<TrialBalance />} />
        <Route path="accounting/reports"            element={<FinancialReports />} />
        <Route path="accounting/ledger/:id"         element={<Ledger />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </SchoolProvider>
  );
}
