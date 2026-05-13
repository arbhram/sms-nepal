import 'dotenv/config';
import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenantPlugin.js';

mongoose.plugin(tenantPlugin);

const { default: School } = await import('../models/School.js');
const { default: User } = await import('../models/User.js');

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

console.log('\n=== SCHOOLS ===');
const schools = await School.find();
schools.forEach(s => {
  console.log(`  ${s.name} | subdomain: ${s.subdomain} | id: ${s._id}`);
});

console.log('\n=== USERS ===');
const users = await User.find().setOptions({ _skipTenant: true }).select('email role schoolId name');
users.forEach(u => {
  const school = schools.find(s => s._id.toString() === u.schoolId?.toString());
  console.log(`  ${u.email} | role: ${u.role} | school: ${school?.subdomain || 'UNKNOWN'} | userId: ${u._id}`);
});

await mongoose.disconnect();
process.exit(0);
