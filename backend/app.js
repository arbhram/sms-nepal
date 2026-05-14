import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { tenantResolver } from './middleware/tenantResolver.js';
import authRoutes from './routes/authRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import classRoutes from './routes/classRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import examRoutes from './routes/examRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import studentPortalRoutes from './routes/studentPortalRoutes.js';
import teacherPortalRoutes from './routes/teacherPortalRoutes.js';
import parentPortalRoutes from './routes/parentPortalRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import reportCardRoutes from './routes/reportCardRoutes.js';
import feeStructureRoutes from './routes/feeStructureRoutes.js';
import systemConfigRoutes from './routes/systemConfigRoutes.js';
import accountingRoutes from './routes/accountingRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const IS_DEV = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://sms-nepal.vercel.app',
    'https://wephas.com',
    'https://www.wephas.com',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (IS_DEV) app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Super admin routes — no tenantResolver, separate auth
app.use('/api/superadmin', superAdminRoutes);

// All tenant routes go through tenantResolver which sets req.school
app.use(tenantResolver);

app.use('/api/school', schoolRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/student-portal', studentPortalRoutes);
app.use('/api/teacher-portal', teacherPortalRoutes);
app.use('/api/parent-portal', parentPortalRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/system-config', systemConfigRoutes);
app.use('/api/accounting',   accountingRoutes);
app.use('/api/payroll',      payrollRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'SMS Nepal API is running...', version: '1.0.0' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
