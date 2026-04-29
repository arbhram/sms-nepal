import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Fee from '../models/Fee.js';
// Use a counter-based ID to guarantee no duplicates across 200+ records
let _idCounter = 1000;
const seqId = (prefix) => `${prefix}${new Date().getFullYear().toString().slice(-2)}${String(_idCounter++).padStart(4, '0')}`;

dotenv.config();
await connectDB();

// ─── Nepali name pools ────────────────────────────────────────────────────────
const maleFirst = [
  'Aarav','Aashish','Aayush','Abhishek','Adarsh','Ajay','Akash','Anil','Anjan','Ankit',
  'Arjun','Aryan','Ashim','Ayush','Bibek','Bijay','Bikash','Bikram','Binod','Deepak',
  'Dipesh','Ganesh','Hari','Jeevan','Kamal','Kishor','Kushal','Madhav','Manish','Nabin',
  'Narayan','Niraj','Nirajan','Paras','Prabhat','Prabin','Prashant','Prakash','Prajwal',
  'Rajan','Rajesh','Ram','Ramesh','Rohan','Rohit','Sagar','Sandip','Santosh','Saroj',
  'Shyam','Suraj','Suresh','Sushil','Umesh','Yubraj','Dinesh','Laxman','Sunil','Nischal',
];

const femaleFirst = [
  'Aakriti','Aarati','Anisha','Anita','Asha','Ashmita','Barsha','Bina','Binita','Deepa',
  'Divya','Gita','Jyoti','Kabita','Kamala','Kavita','Kopila','Kritika','Laxmi','Manisha',
  'Maya','Mina','Nisha','Nita','Prabha','Pratima','Priya','Puja','Radha','Rekha',
  'Rita','Sarita','Samiksha','Samjhana','Sangita','Sapana','Saraswati','Shanta','Shova',
  'Shristi','Sita','Srijana','Sunita','Sushmita','Urmila','Alisha','Smriti','Menuka','Sabina',
  'Rasmita','Poonam','Asmita','Nirmala','Rina','Sushma','Binisha','Roshani','Dipa','Sumitra',
];

const lastNames = [
  'Acharya','Adhikari','Bajracharya','Basnet','Bhandari','Bhattarai','Chhetri','Dahal',
  'Dangol','Dhakal','Ghimire','Gurung','Joshi','Karki','Khadka','Koirala','Lamichhane',
  'Lama','Maharjan','Mahato','Manandhar','Magar','Neupane','Oli','Pandey','Panta',
  'Poudel','Pradhan','Rai','Regmi','Shrestha','Sharma','Silwal','Subedi','Tamang',
  'Thapa','Timilsina','Tuladhar','Upreti','Yadav','Sah','Giri','Bista','Kunwar',
  'Chand','Tharu','Limbu','Sherpa','Sunuwar','Sanyasi',
];

const provinces = ['Koshi','Madhesh','Bagmati','Gandaki','Lumbini','Karnali','Sudurpashchim'];
const municipalities = [
  'Kathmandu Metropolitan City','Lalitpur Metropolitan City','Bhaktapur Municipality',
  'Pokhara Metropolitan City','Biratnagar Metropolitan City','Birgunj Metropolitan City',
  'Dharan Sub-Metropolitan City','Butwal Sub-Metropolitan City','Hetauda Sub-Metropolitan City',
  'Bharatpur Metropolitan City',
];

let nameIdx = 0;
function nextStudent(gender, classRef, section, roll) {
  const pool = gender === 'Male' ? maleFirst : femaleFirst;
  const first = pool[nameIdx % pool.length];
  const last  = lastNames[(nameIdx * 3 + 7) % lastNames.length];
  nameIdx++;
  return {
    studentId: seqId('STU'),
    fullName: `${first} ${last}`,
    gender,
    dateOfBirth: new Date(
      2015 - Math.floor(roll / 5),
      (roll * 7) % 12,
      (roll % 27) + 1,
    ),
    guardianName: `${last} Guardian`,
    guardianPhone: `98${41000000 + nameIdx * 13}`,
    phone: Math.random() > 0.6 ? `98${60000000 + nameIdx * 17}` : '',
    class: classRef,
    section,
    rollNumber: String(roll).padStart(2, '0'),
    municipality: municipalities[nameIdx % municipalities.length],
    wardNumber: String((nameIdx % 32) + 1),
    province: provinces[nameIdx % provinces.length],
    status: 'active',
  };
}

// ─── Teacher data (15 teachers, all Nepali names) ─────────────────────────────
const teacherRows = [
  { fullName: 'Ram Bahadur Sharma',    email: 'ram.sharma@sms.np',    phone: '9841100001', subject: 'Mathematics',          qualification: 'M.Sc. Mathematics',    salary: 48000 },
  { fullName: 'Sita Kumari Thapa',     email: 'sita.thapa@sms.np',    phone: '9841100002', subject: 'English',               qualification: 'M.A. English',         salary: 45000 },
  { fullName: 'Bikash Gurung',         email: 'bikash.gurung@sms.np', phone: '9841100003', subject: 'Nepali',                qualification: 'M.A. Nepali',          salary: 43000 },
  { fullName: 'Kamala Devi Shrestha',  email: 'kamala.shrestha@sms.np',phone:'9841100004', subject: 'Science',               qualification: 'M.Sc. Physics',        salary: 46000 },
  { fullName: 'Narayan Prasad Poudel', email: 'narayan.poudel@sms.np',phone: '9841100005', subject: 'Social Studies',        qualification: 'M.A. History',         salary: 42000 },
  { fullName: 'Sunita Rai',            email: 'sunita.rai@sms.np',    phone: '9841100006', subject: 'Environmental Science', qualification: 'B.Ed. Science',        salary: 40000 },
  { fullName: 'Dipak Kumar Karki',     email: 'dipak.karki@sms.np',   phone: '9841100007', subject: 'Computer',             qualification: 'B.Sc. CSIT',           salary: 44000 },
  { fullName: 'Gita Devi Adhikari',    email: 'gita.adhikari@sms.np', phone: '9841100008', subject: 'Art & Drawing',        qualification: 'B.F.A.',               salary: 38000 },
  { fullName: 'Suresh Bahadur Magar',  email: 'suresh.magar@sms.np',  phone: '9841100009', subject: 'Physical Education',   qualification: 'B.P.Ed.',              salary: 39000 },
  { fullName: 'Anita Tamang',          email: 'anita.tamang@sms.np',  phone: '9841100010', subject: 'Music',                qualification: 'B.A. Music',           salary: 37000 },
  { fullName: 'Prakash Subedi',        email: 'prakash.subedi@sms.np',phone: '9841100011', subject: 'Hindi',                qualification: 'M.A. Hindi',           salary: 41000 },
  { fullName: 'Rekha Dhakal',          email: 'rekha.dhakal@sms.np',  phone: '9841100012', subject: 'Moral Science',        qualification: 'B.Ed.',                salary: 38000 },
  { fullName: 'Nabin Ghimire',         email: 'nabin.ghimire@sms.np', phone: '9841100013', subject: 'General Knowledge',    qualification: 'B.A.',                 salary: 36000 },
  { fullName: 'Manisha Koirala',       email: 'manisha.koirala@sms.np',phone:'9841100014', subject: 'Pre-Primary',          qualification: 'Montessori Certificate',salary: 35000 },
  { fullName: 'Santosh Lamichhane',    email: 'santosh.lamichhane@sms.np',phone:'9841100015',subject:'Sanskrit',            qualification: 'M.A. Sanskrit',        salary: 40000 },
];

const run = async () => {
  try {
    console.log('🌱 Seeding database — clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Class.deleteMany(),
      Student.deleteMany(),
      Teacher.deleteMany(),
      Fee.deleteMany(),
    ]);

    // ── Super admin + admin ──────────────────────────────────────────────────
    await User.create([
      { name: 'Super Admin', email: 'superadmin@sms.np', password: 'admin123', role: 'superadmin' },
      { name: 'School Admin', email: 'admin@sms.np',      password: 'admin123', role: 'admin' },
    ]);
    console.log('✅ Admin accounts created  (admin@sms.np / admin123)');

    // ── Classes: Nursery → Class 5 ───────────────────────────────────────────
    const classData = [
      { name: 'Nursery', sections: ['A','B'], defaultFee: 1800, admissionFee: 5000, transportFee: 800 },
      { name: 'LKG',     sections: ['A','B'], defaultFee: 2000, admissionFee: 5500, transportFee: 800 },
      { name: 'UKG',     sections: ['A','B'], defaultFee: 2200, admissionFee: 6000, transportFee: 900 },
      { name: 'Class 1', sections: ['A','B'], defaultFee: 2500, admissionFee: 7000, transportFee: 1000 },
      { name: 'Class 2', sections: ['A','B'], defaultFee: 2800, admissionFee: 7000, transportFee: 1000 },
      { name: 'Class 3', sections: ['A','B'], defaultFee: 3000, admissionFee: 8000, transportFee: 1100 },
      { name: 'Class 4', sections: ['A','B'], defaultFee: 3200, admissionFee: 8000, transportFee: 1100 },
      { name: 'Class 5', sections: ['A','B'], defaultFee: 3500, admissionFee: 9000, transportFee: 1200 },
    ];
    const classes = await Class.insertMany(classData);
    console.log(`✅ ${classes.length} classes created (Nursery → Class 5)`);

    // ── Teachers ─────────────────────────────────────────────────────────────
    const teacherDocs = teacherRows.map((t) => ({
      teacherId: seqId('TCH'),
      ...t,
      joinDate: new Date(2018 + (teacherRows.indexOf(t) % 6), teacherRows.indexOf(t) % 12, 1),
      status: 'active',
    }));
    const teachers = await Teacher.insertMany(teacherDocs);

    // Create login accounts for all teachers (password: teacher123)
    // insertMany bypasses pre-save hooks, so we hash the password manually first
    const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
    await User.insertMany(
      teachers.map((t) => ({
        name: t.fullName,
        email: t.email,
        password: teacherPasswordHash,
        role: 'teacher',
        linkedTeacher: t._id,
      }))
    );
    console.log(`✅ ${teachers.length} teachers created  (password: teacher123)`);

    // Assign class teachers for a few classes
    await Class.findByIdAndUpdate(classes[0]._id, { classTeacher: teachers[13]._id }); // Nursery → Manisha
    await Class.findByIdAndUpdate(classes[1]._id, { classTeacher: teachers[13]._id }); // LKG → Manisha
    await Class.findByIdAndUpdate(classes[2]._id, { classTeacher: teachers[11]._id }); // UKG → Rekha
    await Class.findByIdAndUpdate(classes[3]._id, { classTeacher: teachers[0]._id  }); // Class 1 → Ram
    await Class.findByIdAndUpdate(classes[4]._id, { classTeacher: teachers[1]._id  }); // Class 2 → Sita
    await Class.findByIdAndUpdate(classes[5]._id, { classTeacher: teachers[3]._id  }); // Class 3 → Kamala
    await Class.findByIdAndUpdate(classes[6]._id, { classTeacher: teachers[4]._id  }); // Class 4 → Narayan
    await Class.findByIdAndUpdate(classes[7]._id, { classTeacher: teachers[2]._id  }); // Class 5 → Bikash

    // ── Students: 25-28 per class, split across A and B sections ─────────────
    // Distribution: [Nursery, LKG, UKG, C1, C2, C3, C4, C5]
    const counts = [25, 25, 25, 28, 28, 28, 26, 26]; // total 211
    const allStudents = [];

    classes.forEach((cls, ci) => {
      const total = counts[ci];
      for (let i = 0; i < total; i++) {
        const gender  = i % 2 === 0 ? 'Male' : 'Female';
        const section = i < Math.ceil(total / 2) ? 'A' : 'B';
        const roll    = (i % Math.ceil(total / 2)) + 1;
        allStudents.push(nextStudent(gender, cls._id, section, roll));
      }
    });

    const createdStudents = await Student.insertMany(allStudents);
    console.log(`✅ ${createdStudents.length} students created across Nursery–Class 5`);

    // ── Admission fees (auto-applied, one per student) ────────────────────────
    const currentYear = `${new Date().getFullYear()}`;
    const feeRecords = createdStudents.map((s) => {
      const cls = classes.find((c) => String(c._id) === String(s.class));
      const assigned = cls?.admissionFee || 5000;
      // Randomise payment state: 40% fully paid, 30% partial, 30% unpaid
      const rand = Math.random();
      let payments = [];
      if (rand < 0.40) {
        payments = [{ amount: assigned, paymentMethod: 'Cash', paidDate: new Date(), receiptNumber: seqId('PMT'), remarks: 'Full payment' }];
      } else if (rand < 0.70) {
        const partial = Math.round(assigned * (0.3 + Math.random() * 0.4));
        payments = [{ amount: partial, paymentMethod: rand > 0.55 ? 'eSewa' : 'Cash', paidDate: new Date(), receiptNumber: seqId('PMT'), remarks: 'Partial payment' }];
      }
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, assigned - totalPaid);
      const status    = totalPaid === 0 ? 'Unpaid' : remaining === 0 ? 'Paid' : 'Partial';
      return {
        receiptNumber: seqId('RCP'),
        student: s._id,
        academicYear: currentYear,
        category: 'Admission',
        totalAssignedFee: assigned,
        totalPaid,
        remainingBalance: remaining,
        status,
        payments,
        feeItems: [{ type: 'Admission', description: 'Admission Fee', amount: assigned }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    });
    await Fee.insertMany(feeRecords);

    // ── Monthly fees for current month ────────────────────────────────────────
    const monthLabel = 'Baishakh 2082';
    const monthlyFees = createdStudents.map((s) => {
      const cls      = classes.find((c) => String(c._id) === String(s.class));
      const assigned = cls?.defaultFee || 2500;
      const rand     = Math.random();
      let payments   = [];
      if (rand < 0.50) {
        payments = [{ amount: assigned, paymentMethod: 'Cash', paidDate: new Date(), receiptNumber: seqId('PMT'), remarks: '' }];
      } else if (rand < 0.75) {
        const partial = Math.round(assigned * (0.4 + Math.random() * 0.3));
        payments = [{ amount: partial, paymentMethod: rand > 0.6 ? 'Khalti' : 'Cash', paidDate: new Date(), receiptNumber: seqId('PMT'), remarks: '' }];
      }
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, assigned - totalPaid);
      const status    = totalPaid === 0 ? 'Unpaid' : remaining === 0 ? 'Paid' : 'Partial';
      return {
        receiptNumber: seqId('RCP'),
        student: s._id,
        academicYear: currentYear,
        category: 'Monthly',
        month: monthLabel,
        totalAssignedFee: assigned,
        totalPaid,
        remainingBalance: remaining,
        status,
        payments,
        feeItems: [{ type: 'Monthly', description: `Monthly Fee — ${monthLabel}`, amount: assigned }],
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
      };
    });
    await Fee.insertMany(monthlyFees);

    console.log(`✅ ${feeRecords.length + monthlyFees.length} fee records created (admission + monthly)`);

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n🎉  Seed complete!\n');
    console.log('  Admin login  →  admin@sms.np     / admin123');
    console.log('  Teacher login→  ram.sharma@sms.np / teacher123  (and 14 others)');
    console.log('\n  Classes      →  Nursery, LKG, UKG, Class 1–5');
    console.log(`  Students     →  ${createdStudents.length}  (Nepali names, Sections A & B)`);
    console.log(`  Teachers     →  ${teachers.length}`);
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
};

run();
