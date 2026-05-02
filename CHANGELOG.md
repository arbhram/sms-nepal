# Changelog

All notable changes to SMS Nepal are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Fixed

- **StudentDashboard fee rows** — icon and status badge now correctly render three states:
  `Paid` (green / CheckCircle), `Partial` (amber / Clock), `Unpaid` (red / XCircle).
  Previously only two states were handled; `Partial` fell through to the red/unpaid branch.
  Field names corrected from non-existent `f.paidAmount` / `f.amount` to `f.status`,
  `f.remainingBalance`, and `f.totalAssignedFee` matching the Fee model schema.

- **axios 401 interceptor** — on any 401 response (expired / invalid token) the interceptor
  now clears localStorage, shows a `"Session expired, please log in again."` toast, and
  redirects to `/login`. The login endpoint itself is excluded so a wrong-password attempt
  does not trigger the session-expired flow.

- **Reports fee chart** — `byCategory` data was mapped with `c.total` (undefined); corrected
  to `c.totalPaid` to match the `feeSummary` aggregation output. Removed unused `Legend`
  import.

- **`updateMe` endpoint** — `PUT /api/auth/me` no longer accepts or applies a `password`
  field in the request body. Password changes must go through `PUT /api/auth/change-password`
  which requires the current password.

- **Settings page** — removed the "New Password" field from the profile form (which was
  silently bypassing the current-password check). A separate "Change Password" card is now
  shown that requires current password, new password, and confirmation before calling
  `/auth/change-password`.

### Security

- **`registerUser` role privilege escalation** — the `POST /api/auth/register` endpoint now
  uses an explicit allowlist `['admin', 'teacher', 'student', 'parent']` for the `role`
  field. Any unrecognised or privileged role (e.g. `superadmin`) is silently coerced to
  `'admin'`. `superadmin` accounts can only be created via the seed script.

- **Login rate limiting** — `POST /api/auth/login` is now protected by `express-rate-limit`:
  5 attempts per IP per 15-minute window. Returns a descriptive 429 message rather than a
  generic response. `RateLimit-*` standard headers are set.

### Added

- **Jest + Supertest integration tests** — minimal test harness using `mongodb-memory-server`
  (no external DB required). Two security-focused tests:
  - `PUT /api/auth/me` ignores `password` in body and does not mutate the hash.
  - `POST /api/auth/register` coerces `superadmin` → `admin`; accepts legitimate roles.
  Run with `npm test` in the `backend/` directory.

- **Cloudinary file storage scaffold** — `config/upload.js` detects
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` at startup.
  When present, files are streamed to Cloudinary (persistent across Render deploys).
  When absent, falls back to local disk storage with a `console.warn` so local development
  is unaffected. See `.env.example` for the required variable names.

  **TODO (action required):** Add the three Cloudinary env vars to your Render dashboard.
  Until then, uploaded photos/documents will be lost on every redeploy.

- **`app.js` extracted** — Express app setup moved to `app.js`; `server.js` only handles
  `connectDB()` + `app.listen()`. This separation allows tests to import the app without
  starting the HTTP server.

- **Parent portal** — new role-specific portal at `/parent/*`. Parents can view fees,
  attendance, exam results, and notices for each of their children. Portal shell includes
  a child switcher (dropdown in sidebar) that re-fetches all data for the selected child.
  All routes are protected by `authorize('parent')`; backend validates every request
  against the parent's `linkedStudents` array before returning data.

- **Admin parent management** — new `/parents` admin page (sidebar entry). Admins can
  create parent accounts (auto-generated password shown once), edit linked children via
  multi-select checkbox list, reset passwords, and delete accounts. Backed by
  `GET|POST|PUT|DELETE /api/parents`.

- **`User.linkedStudents` array migration** — `linkedStudent: ObjectId` replaced with
  `linkedStudents: [ObjectId]` to support families with multiple children in the same
  school. All references updated: `studentController`, `notify.js`, and the student
  portal query. Existing single-child relationships remain valid (array of length 1).

- **Reusable `ConfirmModal` component** — replaced all six browser `window.confirm()` calls
  across the frontend with a consistent modal dialog (`AlertTriangle` icon, Cancel / action
  buttons). Affected pages: StudentList, TeacherList, ClassList, NoticeBoard, ExamList,
  FeeList (payment removal). Danger actions show rose styling; non-danger show amber.

---

## [Pre-changelog baseline]

Features present before this changelog was introduced:

- Admin portal: students, teachers, classes, fees, attendance, exams, reports, notices
- Teacher portal: dashboard, students, attendance, exams, notices, change password
- Student portal: dashboard, fees, attendance, exams, notices, change password
- JWT auth with role-based route guards (admin / teacher / student)
- In-app notifications with bell dropdown (unread count, mark read/all)
- Notice board with audience targeting (teacher / student / both)
- Bulk attendance marking with CSV export
- Fee engine: assign, bulk assign, payments, history, auto-status computation
- Dashboard stats with charts (revenue trend, attendance donut, upcoming exams)
