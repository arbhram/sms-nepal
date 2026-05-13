/**
 * One-time seed script: creates the first super admin account.
 * Run once on a fresh deployment:
 *   node backend/scripts/createSuperAdmin.js
 *
 * Environment variables required: MONGO_URI, SUPER_ADMIN_JWT_SECRET
 */

import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });
import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenantPlugin.js';

mongoose.plugin(tenantPlugin);

const { default: connectDB } = await import('../config/db.js');
const { default: SuperAdmin } = await import('../models/SuperAdmin.js');

await connectDB();

const { SUPER_ADMIN_EMAIL = 'superadmin@myschoolsaas.com', SUPER_ADMIN_PASSWORD = 'changeme123' } = process.env;

const existing = await SuperAdmin.findOne({ email: SUPER_ADMIN_EMAIL });
if (existing) {
  console.log(`Super admin already exists: ${SUPER_ADMIN_EMAIL}`);
  process.exit(0);
}

await SuperAdmin.create({
  name: 'Super Admin',
  email: SUPER_ADMIN_EMAIL,
  password: SUPER_ADMIN_PASSWORD,
  isActive: true,
});

console.log(`\nSuper admin created:`);
console.log(`  Email   : ${SUPER_ADMIN_EMAIL}`);
console.log(`  Password: ${SUPER_ADMIN_PASSWORD}`);
console.log(`\nChange the password immediately after first login.\n`);

await mongoose.disconnect();
process.exit(0);
