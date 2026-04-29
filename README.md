# SMS Nepal - Student Management System

A full-stack Student Management System built with the MERN stack for schools, colleges, and training institutes in Nepal.

## Features

- Role-based access: Super Admin, Admin, Teacher, Student, Parent
- Dashboard with charts for revenue, attendance, and upcoming exams
- Student and teacher management
- Fee management with installments, payments, and receipts
- Bulk attendance marking (Present, Absent, Late, Leave)
- Exam system with Nepali grading scale (A+ to F)
- JWT authentication with protected routes
- Nepal-specific fields: Citizenship number, ward, province, eSewa / Khalti / FonePay payments
- Fully responsive design

## Project Structure

```
sms-nepal/
├── backend/                 Express + MongoDB API
│   ├── config/              DB connection and upload config
│   ├── controllers/         Route handlers
│   ├── middleware/          Auth and error handling
│   ├── models/              Mongoose schemas
│   ├── routes/              API routes
│   ├── utils/               Helpers and seed script
│   └── server.js            Entry point
└── frontend/                React + Vite + Tailwind CSS
    └── src/
        ├── api/             Axios instance
        ├── components/      UI components
        ├── context/         Auth context
        └── pages/           Route pages
```

## Getting Started

### Requirements

- Node.js 18 or newer
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
cp .env.example .env       # edit MONGO_URI and JWT_SECRET
npm install
npm run seed               # optional: creates demo data
npm run dev                # runs on http://localhost:5000
```

The seed script creates:
- Admin: admin@sms.np / admin123
- Super Admin: superadmin@sms.np / admin123
- 5 classes, 3 teachers, 12 students, fee records, 1 sample exam

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                # runs on http://localhost:5173
```

Open http://localhost:5173 and log in with the seeded credentials.

## Tech Stack

**Frontend**
- React 18 + Vite
- React Router 6
- Tailwind CSS
- Recharts
- Formik + Yup
- Axios
- Lucide React
- React Hot Toast

**Backend**
- Node.js + Express 4
- MongoDB + Mongoose 8
- JWT + bcryptjs
- Multer
- CORS, Morgan, dotenv

## API Overview

All endpoints are under `/api` and require `Authorization: Bearer <token>` except `/api/auth/login`.

| Area       | Endpoint                                                                 |
|------------|--------------------------------------------------------------------------|
| Auth       | POST /auth/login, GET /auth/me, PUT /auth/me                             |
| Students   | GET/POST/PUT/DELETE /students, POST /students/bulk, POST /students/promote |
| Teachers   | GET/POST/PUT/DELETE /teachers                                            |
| Classes    | GET/POST/PUT/DELETE /classes                                             |
| Fees       | GET/POST /fees, POST /fees/:id/pay, GET /fees/summary                    |
| Attendance | POST /attendance/bulk, GET /attendance, GET /attendance/student/:id/summary |
| Exams      | GET/POST /exams, POST /exams/:id/results, GET /exams/:id/results         |
| Dashboard  | GET /dashboard                                                           |

## User Roles

| Role           | Capabilities                                          |
|----------------|-------------------------------------------------------|
| Super Admin    | Full control, manage admins, system settings          |
| Admin          | Students, teachers, fees, attendance, exams, reports  |
| Teacher        | View students, mark attendance, upload marks          |
| Student/Parent | View their profile, attendance, fees, marks           |

## Deployment Notes

- Set NODE_ENV=production and a strong JWT_SECRET
- Use MongoDB Atlas or a managed Mongo instance
- Run npm run build in frontend/ and serve the dist/ folder
- Point CLIENT_URL in backend .env to your deployed frontend URL

## License

MIT
