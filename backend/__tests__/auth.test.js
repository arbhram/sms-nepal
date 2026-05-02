/**
 * Integration tests for auth security fixes:
 *   - Bug 2: PUT /api/auth/me must NOT update password
 *   - Bug 4: POST /api/auth/register must reject / coerce privileged roles
 */
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../models/User.js';
import { setupDB, teardownDB, clearDB } from './helpers/db.js';

beforeAll(async () => { await setupDB(); });
afterAll(async () => { await teardownDB(); });
afterEach(async () => { await clearDB(); });

// ── helpers ──────────────────────────────────────────────────────────────────

async function createAdminAndLogin() {
  await User.create({
    name: 'Test Admin',
    email: 'admin@test.np',
    password: 'password123',
    role: 'admin',
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.np', password: 'password123' });
  return res.body.token;
}

// ── Bug 2: updateMe must ignore password field ────────────────────────────────

describe('PUT /api/auth/me (Bug 2 — updateMe password security)', () => {
  it('ignores a password field in the request body', async () => {
    const token = await createAdminAndLogin();
    const originalHash = (await User.findOne({ email: 'admin@test.np' })).password;

    await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', password: 'newpassword999' })
      .expect(200);

    const user = await User.findOne({ email: 'admin@test.np' });
    expect(user.name).toBe('Updated Name');
    // Password hash must be unchanged
    expect(user.password).toBe(originalHash);
    // The new password must NOT work
    const matches = await bcrypt.compare('newpassword999', user.password);
    expect(matches).toBe(false);
  });
});

// ── Bug 4: registerUser must coerce privileged roles ─────────────────────────

describe('POST /api/auth/register (Bug 4 — role allowlist)', () => {
  it('coerces an attempt to register a superadmin to admin', async () => {
    const token = await createAdminAndLogin();

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Evil User',
        email: 'evil@test.np',
        password: 'password123',
        role: 'superadmin',
      })
      .expect(201);

    expect(res.body.role).toBe('admin');

    const stored = await User.findOne({ email: 'evil@test.np' });
    expect(stored.role).toBe('admin');
  });

  it('accepts a legitimate role like teacher', async () => {
    const token = await createAdminAndLogin();

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Good Teacher',
        email: 'teacher@test.np',
        password: 'password123',
        role: 'teacher',
      })
      .expect(201);

    expect(res.body.role).toBe('teacher');
  });
});
