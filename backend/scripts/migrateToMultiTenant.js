/**
 * One-time migration: creates the first School document and stamps every
 * existing record with its _id.
 *
 * Run:  node backend/scripts/migrateToMultiTenant.js
 *
 * Safe to run multiple times — skips collections that already have schoolId set.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB\n');

const db = mongoose.connection;

// ── 1. Create the school (skip if already exists) ───────────────────────────
let schoolsCol = db.collection('schools');
let school = await schoolsCol.findOne({});

if (!school) {
  const result = await schoolsCol.insertOne({
    name:        process.env.SCHOOL_NAME || 'My School',
    subdomain:   process.env.SCHOOL_SUBDOMAIN || 'myschool',
    plan:        'starter',
    dbMode:      'shared',
    dbUri:       null,
    isActive:    true,
    trialEndsAt: new Date('2030-01-01'),
    address:     '',
    phone:       '',
    email:       '',
    logoUrl:     '',
    timezone:    'Asia/Kathmandu',
    currency:    'NPR',
    createdAt:   new Date(),
    updatedAt:   new Date(),
  });
  school = await schoolsCol.findOne({ _id: result.insertedId });
  console.log(`✅ School created: "${school.name}" (subdomain: ${school.subdomain})`);
} else {
  console.log(`ℹ️  School already exists: "${school.name}" (${school._id})`);
}

const schoolId = school._id;

// ── 2. Stamp every collection ────────────────────────────────────────────────
const collections = [
  'users', 'students', 'teachers', 'parents',
  'classes', 'fees', 'feestructures', 'studentfeeassignments',
  'attendances', 'exams', 'grades', 'gradebooks',
  'journals', 'accounts', 'counters', 'transactions', 'payrolls',
  'notices', 'notifications', 'reportcards', 'systemconfigs',
];

for (const name of collections) {
  try {
    const col = db.collection(name);
    const result = await col.updateMany(
      { schoolId: { $exists: false } },
      { $set: { schoolId } },
    );
    if (result.matchedCount > 0) {
      console.log(`✅ ${name}: stamped ${result.modifiedCount} records`);
    } else {
      console.log(`   ${name}: already stamped or empty`);
    }
  } catch {
    console.log(`   ${name}: skipped (collection may not exist)`);
  }
}

await mongoose.disconnect();
console.log('\nMigration complete. schoolId:', schoolId.toString());
console.log(`\nLogin with: schoolCode = "${school.subdomain}"`);
