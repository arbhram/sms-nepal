/**
 * Tenant isolation smoke-test.
 *
 * Connects to a THROW-AWAY test database — never run against production.
 *
 * Usage:
 *   node backend/scripts/testTenantIsolation.js
 *   TEST_MONGO_URI=mongodb://localhost:27017/sms_iso_test node backend/scripts/testTenantIsolation.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenantPlugin.js';
import { tenantContext } from '../tenant/context.js';

// Register plugin before any model file is evaluated
mongoose.plugin(tenantPlugin);

// Dynamic imports so model schemas are created AFTER plugin registration
const { default: School }  = await import('../models/School.js');
const { default: Student } = await import('../models/Student.js');
const { default: User }    = await import('../models/User.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL  ${label}${detail ? `\n         got: ${detail}` : ''}`);
    failed++;
  }
}

/** Run fn inside the given school's tenant context. */
function inContext(schoolId, fn) {
  return new Promise((resolve, reject) => {
    tenantContext.run(
      { schoolId, userId: new mongoose.Types.ObjectId(), role: 'admin' },
      () => Promise.resolve().then(fn).then(resolve).catch(reject),
    );
  });
}

// ─── Connect ──────────────────────────────────────────────────────────────────

// Derive test URI from the same Atlas cluster but a separate database so
// production data is never touched. Swaps /dbname in the URI path.
function makeTestUri(base, testDb) {
  // Handles both mongodb:// and mongodb+srv:// URIs
  // URI shape: scheme://user:pass@host/dbname?options
  return base.replace(/\/([^/?]+)(\?|$)/, `/${testDb}$2`);
}

const TEST_DB =
  process.env.TEST_MONGO_URI ||
  (process.env.MONGO_URI
    ? makeTestUri(process.env.MONGO_URI, 'sms_iso_test')
    : 'mongodb://127.0.0.1:27017/sms_iso_test');

await mongoose.connect(TEST_DB);
console.log(`\nConnected: ${TEST_DB}`);
await mongoose.connection.dropDatabase(); // start clean

// ─── Seed ─────────────────────────────────────────────────────────────────────

const [schoolA, schoolB] = await School.insertMany([
  { name: 'School A', subdomain: 'school-a', plan: 'starter', isActive: true, trialEndsAt: new Date('2030-01-01') },
  { name: 'School B', subdomain: 'school-b', plan: 'starter', isActive: true, trialEndsAt: new Date('2030-01-01') },
]);

const fakeClass = new mongoose.Types.ObjectId();

const base = (suffix) => ({
  studentId: `S-${suffix}`,
  fullName: `Student ${suffix}`,
  gender: 'Male',
  dateOfBirth: new Date('2010-01-01'),
  guardianName: `Guardian ${suffix}`,
  guardianPhone: '9800000001',
  class: fakeClass,
});

await inContext(schoolA._id, () => Student.create(base('A')));
await inContext(schoolB._id, () => Student.create(base('B')));

// Same email in both schools (valid after compound index fix)
await inContext(schoolA._id, () =>
  User.create({ name: 'Admin A', email: 'shared@test.com', password: 'password123' }),
);
await inContext(schoolB._id, () =>
  User.create({ name: 'Admin B', email: 'shared@test.com', password: 'password123' }),
);

console.log('\nSeed complete — running isolation tests\n');

// ─── Test 1: find() ────────────────────────────────────────────────────────────

console.log('── 1  Student.find() ──');
await inContext(schoolA._id, async () => {
  const docs = await Student.find({});
  assert(docs.length === 1, 'returns only school-A students', docs.length);
  assert(docs[0].studentId === 'S-A', 'correct student returned');
  assert(
    docs.every(d => d.schoolId.toString() === schoolA._id.toString()),
    'all schoolIds are school A',
  );
});

// ─── Test 2: findOne() ─────────────────────────────────────────────────────────

console.log('\n── 2  Student.findOne() ──');
await inContext(schoolA._id, async () => {
  const doc = await Student.findOne({});
  assert(doc !== null, 'returns a result');
  assert(doc.studentId === 'S-A', 'correct student');
  assert(doc.schoolId.toString() === schoolA._id.toString(), 'schoolId is school A');
});

// ─── Test 3: aggregate() ───────────────────────────────────────────────────────

console.log('\n── 3  Student.aggregate() ──');
await inContext(schoolA._id, async () => {
  const results = await Student.aggregate([{ $match: {} }]);
  assert(results.length === 1, 'aggregate returns only school-A students', results.length);
  assert(
    results[0].schoolId.toString() === schoolA._id.toString(),
    'aggregate schoolId is school A',
  );
});

// ─── Test 4: countDocuments() ──────────────────────────────────────────────────

console.log('\n── 4  Student.countDocuments() ──');
await inContext(schoolA._id, async () => {
  const count = await Student.countDocuments({});
  assert(count === 1, 'count is 1, not 2 (no cross-tenant bleed)', count);
});

// ─── Test 5: context wins over body-supplied schoolId ─────────────────────────

console.log('\n── 5  Context schoolId overrides body-supplied schoolId ──');
await inContext(schoolA._id, async () => {
  const doc = await Student.create({ ...base('TAMPER'), schoolId: schoolB._id });
  assert(
    doc.schoolId.toString() === schoolA._id.toString(),
    'saved with context schoolId (A), not body schoolId (B)',
    doc.schoolId,
  );
});

// ─── Test 6: same email scoped per school ──────────────────────────────────────

console.log('\n── 6  Same email unique per school ──');
await inContext(schoolA._id, async () => {
  const users = await User.find({ email: 'shared@test.com' });
  assert(users.length === 1, 'find() by email returns 1 user, not 2', users.length);
  assert(users[0].schoolId.toString() === schoolA._id.toString(), 'user belongs to school A');
});

// ─── Test 7: school B sees only its own data ───────────────────────────────────

console.log('\n── 7  School B sees only its own students ──');
await inContext(schoolB._id, async () => {
  const docs = await Student.find({});
  assert(docs.length === 1, 'school B count is 1 (S-TAMPER belongs to A)', docs.length);
  assert(docs[0].studentId === 'S-B', 'only S-B returned');
});

// ─── Test 8: query outside context throws ─────────────────────────────────────

console.log('\n── 8  Query outside tenant context throws ──');
try {
  await Student.find({});
  assert(false, 'find() outside context should throw — but did not');
} catch (err) {
  assert(
    err.message.includes('Tenant context missing'),
    'find() outside context throws "Tenant context missing"',
    err.message,
  );
}

// ─── Test 9: aggregate outside context throws ──────────────────────────────────

console.log('\n── 9  aggregate() outside tenant context throws ──');
try {
  await Student.aggregate([{ $match: {} }]);
  assert(false, 'aggregate() outside context should throw — but did not');
} catch (err) {
  assert(
    err.message.includes('Tenant context missing'),
    'aggregate() outside context throws "Tenant context missing"',
    err.message,
  );
}

// ─── Test 10: cross-tenant query condition is blocked ─────────────────────────

console.log('\n── 10 Cross-tenant query condition is rejected ──');
await inContext(schoolA._id, async () => {
  try {
    await Student.find({ schoolId: schoolB._id });
    assert(false, 'cross-tenant find() should throw — but did not');
  } catch (err) {
    assert(
      err.message.includes('Cross-tenant query blocked'),
      'cross-tenant find() throws "Cross-tenant query blocked"',
      err.message,
    );
  }
});

// ─── Cleanup ──────────────────────────────────────────────────────────────────

await mongoose.connection.dropDatabase();
await mongoose.disconnect();

console.log(`\n${'─'.repeat(52)}`);
console.log(`  ${passed} passed  /  ${failed} failed`);
console.log(failed === 0 ? '  ✅ All tests passed!' : '  ❌ Some tests failed — see FAIL lines above.');
process.exit(failed === 0 ? 0 : 1);
