/**
 * Idempotent migration: ensures all User documents have a lastLogin field.
 * Existing users without it get null (Mongoose default) — this is a no-op
 * in practice since Mongoose already treats missing Date fields as null.
 * Run as a safety check before deploying the lastLogin feature.
 *
 * Run: node backend/scripts/migrateLastLogin.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenantPlugin.js';

mongoose.plugin(tenantPlugin);

const { default: connectDB } = await import('../config/db.js');

await connectDB();

const result = await mongoose.connection.collection('users').updateMany(
  { lastLogin: { $exists: false } },
  { $set: { lastLogin: null } },
);

console.log(`✓ Stamped ${result.modifiedCount} user(s) with lastLogin: null`);
console.log(`  (${result.matchedCount} matched, ${result.modifiedCount} updated)`);

await mongoose.disconnect();
process.exit(0);
