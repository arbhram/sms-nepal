/**
 * Idempotent migration: stamps all SuperAdmin documents that are missing
 * a `role` field with 'owner'.
 *
 * Safe to re-run — only touches documents where role is null/undefined.
 *
 * Run: node backend/scripts/migrateSuperAdminRole.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenantPlugin.js';

mongoose.plugin(tenantPlugin);

const { default: connectDB } = await import('../config/db.js');
const { default: SuperAdmin } = await import('../models/SuperAdmin.js');

await connectDB();

const result = await SuperAdmin.updateMany(
  { role: { $exists: false } },
  { $set: { role: 'owner' } },
);

console.log(`✓ Stamped ${result.modifiedCount} super admin(s) with role 'owner'`);
console.log(`  (${result.matchedCount} matched, ${result.modifiedCount} updated)`);

await mongoose.disconnect();
process.exit(0);
