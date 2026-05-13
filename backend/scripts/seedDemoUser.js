// backend/scripts/seedDemoUser.js
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenantPlugin.js';

mongoose.plugin(tenantPlugin);

const { default: School } = await import('../models/School.js');
const { default: User } = await import('../models/User.js');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('No MongoDB URI in env');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log('Connected to MongoDB');

// 1. Find or create the demo school
let school = await School.findOne({ subdomain: 'myschool' });
if (!school) {
  school = await School.create({
    name: 'My Demo School',
    subdomain: 'myschool',
    plan: 'starter',
    isActive: true,
    trialEndsAt: new Date('2030-01-01'),
  });
  console.log('✅ Created demo school');
} else {
  console.log('✅ Demo school exists');
}

// 2. Delete any existing demo user (clean slate)
await User.deleteOne({ email: 'admin@sms.np' }).setOptions({ _skipTenant: true });

// 3. Create fresh demo user — pass plaintext password, let the model's 
//    pre('save') hook hash it ONCE
const user = await User.create({
  name: 'Demo Admin',
  email: 'admin@sms.np',
  password: 'admin123',  // ← plaintext, will be hashed by pre-save hook
  role: 'admin',
  schoolId: school._id,
  isActive: true,
});

console.log('✅ Created demo admin user');
console.log('\n🎉 Login credentials:');
console.log('   schoolCode: myschool');
console.log('   email:      admin@sms.np');
console.log('   password:   admin123');

await mongoose.disconnect();
process.exit(0);