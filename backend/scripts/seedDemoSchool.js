/**
 * Demo seed script — wipes and rebuilds "Saraswati Public School"
 * with realistic Nepali data for sales demos.
 *
 * Run:  node backend/scripts/seedDemoSchool.js
 * Safe to re-run — always wipes the saraswati school first.
 */

import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenantPlugin.js';
import { tenantContext } from '../tenant/context.js';

// Register global plugin before any model is imported
mongoose.plugin(tenantPlugin);

// Dynamic imports — models must load AFTER mongoose.plugin()
const { default: School }       = await import('../models/School.js');
const { default: User }         = await import('../models/User.js');
const { default: Teacher }      = await import('../models/Teacher.js');
const { default: Class }        = await import('../models/Class.js');
const { default: Student }      = await import('../models/Student.js');
const { default: FeeStructure } = await import('../models/FeeStructure.js');
const { default: Fee }          = await import('../models/Fee.js');
const { default: Journal }      = await import('../models/Journal.js');
const { default: Account }      = await import('../models/Account.js');

const { seedAccounts }                               = await import('../seeders/seedAccounts.js');
const { postJournal }                                = await import('../services/journalService.js');
const { postInvoiceJournal, postPaymentJournal }     = await import('../services/feeAccountingService.js');
const { createPayrollRun, accruePayroll, disbursePayroll } = await import('../services/payrollService.js');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('❌  MONGO_URI not set'); process.exit(1); }

await mongoose.connect(MONGO_URI);
console.log('✅  MongoDB connected\n');

// ── Dates (Baishakh 2083 ≈ April 2026) ──────────────────────────────────────
const ACADEMIC_YEAR = '2083';
const BAISHAKH_1  = new Date('2026-04-14');
const BAISHAKH_15 = new Date('2026-04-28');
const BAISHAKH_30 = new Date('2026-05-13');
const OVERDUE     = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// ── 1. Wipe existing saraswati data ─────────────────────────────────────────
console.log('🗑   Wiping existing saraswati data...');
const existing = await School.findOne({ subdomain: 'saraswati' });
if (existing) {
  const sid = existing._id;
  const COLLECTIONS = [
    'users', 'students', 'teachers', 'classes', 'fees', 'feestructures',
    'studentfeeassignments', 'attendances', 'exams', 'grades', 'gradebooks',
    'journals', 'accounts', 'counters', 'payrolls', 'notices',
    'notifications', 'reportcards', 'systemconfigs', 'transactions',
  ];
  for (const col of COLLECTIONS) {
    try { await mongoose.connection.collection(col).deleteMany({ schoolId: sid }); } catch { /* ok */ }
  }
  await School.deleteOne({ _id: sid });
  console.log('    ✓ Wiped previous data\n');
} else {
  console.log('    (no existing data found)\n');
}

// ── 2. Create school ─────────────────────────────────────────────────────────
console.log('🏫  Creating school...');
const trialEndsAt = new Date();
trialEndsAt.setDate(trialEndsAt.getDate() + 30);

const school = await School.create({
  name:                 'Saraswati Public School',
  subdomain:            'saraswati',
  address:              'Lalitpur, Nepal',
  plan:                 'starter',
  isActive:             true,
  trialEndsAt,
  timezone:             'Asia/Kathmandu',
  currency:             'NPR',
  primaryColor:         '#0c7fff',
  customDomainVerified: false,
});
console.log(`    ✓ School: ${school.name} (${school._id})\n`);

// ── All remaining operations run inside tenant context ───────────────────────
await tenantContext.run({ schoolId: school._id }, async () => {

  // Helper to resolve account code → ObjectId
  async function acct(code) {
    const a = await Account.findOne({ code });
    if (!a) throw new Error(`Account ${code} not found — run seedAccounts first`);
    return a._id;
  }

  // Sequential receipt number generator
  let seq = 1;
  const nextSeq = () => String(seq++).padStart(4, '0');

  // ── 3. Chart of accounts ──────────────────────────────────────────────────
  console.log('📊  Seeding chart of accounts...');
  await seedAccounts();
  console.log('    ✓ Chart of accounts ready\n');

  // ── 4. Admin user ─────────────────────────────────────────────────────────
  console.log('👤  Creating admin user...');
  const admin = await User.create({
    name: 'Ramesh Sharma', email: 'admin@saraswati.np',
    password: 'admin123',   // plaintext — pre-save hook hashes it
    role: 'admin', phone: '9841000001', isActive: true,
  });
  console.log(`    ✓ ${admin.name} <${admin.email}>\n`);

  // ── 5. Teachers ───────────────────────────────────────────────────────────
  console.log('👩‍🏫  Creating teachers...');
  const teacherDefs = [
    { teacherId: 'T001', fullName: 'Sita Adhikari',   phone: '9841100001', subject: 'Nepali',      salary: 25000 },
    { teacherId: 'T002', fullName: 'Bibek Thapa',     phone: '9841100002', subject: 'Mathematics', salary: 25000 },
    { teacherId: 'T003', fullName: 'Anjali Maharjan', phone: '9841100003', subject: 'English',     salary: 25000 },
    { teacherId: 'T004', fullName: 'Suman Karki',     phone: '9841100004', subject: 'Science',     salary: 25000 },
    { teacherId: 'T005', fullName: 'Prakash KC',      phone: '9841100005', subject: 'Social',      salary: 25000 },
  ];
  const teachers = [];
  for (const t of teacherDefs) {
    teachers.push(await Teacher.create({ ...t, status: 'active' }));
  }
  console.log(`    ✓ ${teachers.length} teachers\n`);

  // ── 6. Classes ────────────────────────────────────────────────────────────
  console.log('🏛   Creating classes...');
  const classDefs = [
    { name: 'Class 1', sections: ['A'], classTeacher: teachers[0]._id },
    { name: 'Class 2', sections: ['A'], classTeacher: teachers[1]._id },
    { name: 'Class 3', sections: ['A'], classTeacher: teachers[2]._id },
    { name: 'Class 4', sections: ['A'], classTeacher: teachers[3]._id },
  ];
  const classes = [];
  for (const c of classDefs) classes.push(await Class.create(c));
  console.log(`    ✓ ${classes.length} classes\n`);

  // ── 7. Students (5 per class) ─────────────────────────────────────────────
  console.log('🎓  Creating students...');
  // [fullName, guardianName, guardianPhone]
  const studentDefs = [
    // Class 1 (age ~6)
    ['Aarav Sharma',     'Ram Sharma',        '9841200001'],
    ['Aanya Thapa',      'Hari Thapa',         '9841200002'],
    ['Sushma Karki',     'Gopal Karki',        '9841200003'],
    ['Pratibha Rai',     'Dhan Rai',           '9841200004'],
    ['Sandesh Shrestha', 'Mohan Shrestha',     '9841200005'],
    // Class 2 (age ~7)
    ['Bibek Tamang',     'Kiran Tamang',       '9841200006'],
    ['Manisha Gurung',   'Prem Gurung',        '9841200007'],
    ['Rabin Magar',      'Bal Magar',          '9841200008'],
    ['Priya Poudel',     'Shiva Poudel',       '9841200009'],
    ['Arjun Gautam',     'Sanjay Gautam',      '9841200010'],
    // Class 3 (age ~8)
    ['Sneha Joshi',      'Ravi Joshi',         '9841200011'],
    ['Kabir KC',         'Nabin KC',           '9841200012'],
    ['Riya Adhikari',    'Tara Adhikari',      '9841200013'],
    ['Sagar Bhattarai',  'Laxman Bhattarai',   '9841200014'],
    ['Anisha Regmi',     'Sunil Regmi',        '9841200015'],
    // Class 4 (age ~9)
    ['Niraj Basnet',     'Dinesh Basnet',      '9841200016'],
    ['Pooja Limbu',      'Surya Limbu',        '9841200017'],
    ['Hari Bhandari',    'Bishnu Bhandari',    '9841200018'],
    ['Aastha Pandey',    'Rajesh Pandey',      '9841200019'],
    ['Saurav Dahal',     'Prakash Dahal',      '9841200020'],
  ];

  const students = [];
  for (let i = 0; i < 20; i++) {
    const classIdx  = Math.floor(i / 5);
    const birthYear = 2020 - classIdx;
    const [fullName, guardianName, guardianPhone] = studentDefs[i];
    students.push(await Student.create({
      studentId:    `S${String(i + 1).padStart(3, '0')}`,
      fullName,
      dateOfBirth:  new Date(`${birthYear}-03-15`),
      gender:       i % 2 === 0 ? 'Male' : 'Female',
      class:        classes[classIdx]._id,
      guardianName,
      guardianPhone,
      address:      'Lalitpur, Nepal',
      status:       'active',
    }));
  }
  console.log(`    ✓ ${students.length} students\n`);

  // ── 8. Fee structures ─────────────────────────────────────────────────────
  console.log('💰  Creating fee structures...');
  const tuitionAmounts = [2500, 3000, 3500, 4000]; // Class 1–4
  for (let i = 0; i < 4; i++) {
    await FeeStructure.create({
      class: classes[i]._id, academicYear: ACADEMIC_YEAR,
      name: `${classes[i].name} Fee Structure 2083`,
      components: [
        { name: 'Tuition Fee',   amount: tuitionAmounts[i], frequency: 'monthly',  category: 'Monthly',   isOptional: false },
        { name: 'Transport Fee', amount: 1500,              frequency: 'monthly',  category: 'Transport', isOptional: true  },
      ],
      isActive: true, createdBy: admin._id,
    });
  }
  console.log('    ✓ 4 fee structures (Class 1–4)\n');

  // ── 9. Fee invoices ───────────────────────────────────────────────────────
  // Even-indexed students (0,2,4,...) also get transport
  // Payment breakdown by student:
  //   students 0–11  (60%) → PAID in full
  //   students 12–15 (20%) → PARTIAL (half paid)
  //   students 16–19 (20%) → UNPAID (overdue)
  console.log('📄  Creating fee invoices...');

  // Bucket each student's fees so we can mark payments per student
  const studentFees = {}; // studentIndex → [fee, ...]
  for (let i = 0; i < 20; i++) studentFees[i] = [];

  for (let i = 0; i < 20; i++) {
    const classIdx  = Math.floor(i / 5);
    const student   = students[i];
    const hasTransport = i % 2 === 0;

    const tuitionFee = await Fee.create({
      student:          student._id,
      category:         'Monthly',
      totalAssignedFee: tuitionAmounts[classIdx],
      discount:         0,
      month:            'Baishakh 2083',
      academicYear:     ACADEMIC_YEAR,
      dueDate:          OVERDUE,
      receiptNumber:    `INV-${nextSeq()}`,
      createdBy:        admin._id,
    });
    // Post AR + Revenue journal for the invoice
    await postInvoiceJournal({
      fee: { ...tuitionFee.toObject(), student: { _id: student._id, fullName: student.fullName } },
      createdBy: admin._id,
    }, null);
    studentFees[i].push(tuitionFee);

    if (hasTransport) {
      const transportFee = await Fee.create({
        student:          student._id,
        category:         'Transport',
        totalAssignedFee: 1500,
        discount:         0,
        month:            'Baishakh 2083',
        academicYear:     ACADEMIC_YEAR,
        dueDate:          OVERDUE,
        receiptNumber:    `INV-${nextSeq()}`,
        createdBy:        admin._id,
      });
      await postInvoiceJournal({
        fee: { ...transportFee.toObject(), student: { _id: student._id, fullName: student.fullName } },
        createdBy: admin._id,
      }, null);
      studentFees[i].push(transportFee);
    }
  }

  const totalInvoices = Object.values(studentFees).flat().length;
  console.log(`    ✓ ${totalInvoices} fee invoices (20 tuition + 10 transport)\n`);

  // ── 10. Fee payments ──────────────────────────────────────────────────────
  console.log('💳  Recording payments...');
  let paidStudents = 0, partialStudents = 0, unpaidStudents = 0;

  for (let i = 0; i < 20; i++) {
    const student = students[i];
    const fees    = studentFees[i];
    const paidDate = new Date(BAISHAKH_1.getTime() + (i + 1) * 24 * 60 * 60 * 1000);

    if (i < 12) {
      // PAID — full payment for all this student's fees
      for (const fee of fees) {
        const payment = {
          amount: fee.totalAssignedFee,
          paymentMethod: 'Cash',
          paidDate,
          receiptNumber: `RCPT-${nextSeq()}`,
        };
        fee.payments.push(payment);
        fee.dueDate = new Date(BAISHAKH_1.getTime() + 45 * 24 * 60 * 60 * 1000);
        await fee.save(); // pre-save hook sets status = 'Paid'
        await postPaymentJournal({
          fee: { ...fee.toObject(), student: { _id: student._id, fullName: student.fullName } },
          payment,
          createdBy: admin._id,
        }, null);
      }
      paidStudents++;
    } else if (i < 16) {
      // PARTIAL — half payment for all this student's fees
      for (const fee of fees) {
        const halfAmount = Math.floor(fee.totalAssignedFee / 2);
        const payment = {
          amount: halfAmount,
          paymentMethod: 'Cash',
          paidDate,
          receiptNumber: `RCPT-${nextSeq()}`,
        };
        fee.payments.push(payment);
        await fee.save(); // pre-save hook sets status = 'Partial'
        await postPaymentJournal({
          fee: { ...fee.toObject(), student: { _id: student._id, fullName: student.fullName } },
          payment,
          createdBy: admin._id,
        }, null);
      }
      partialStudents++;
    } else {
      // UNPAID — already Unpaid, just keep dueDate as OVERDUE (already set)
      unpaidStudents++;
    }
  }
  console.log(`    ✓ Paid: ${paidStudents} students  Partial: ${partialStudents}  Unpaid: ${unpaidStudents}\n`);

  // ── 11. Payroll — Baishakh 2083 ───────────────────────────────────────────
  console.log('💼  Processing payroll (Baishakh 2083)...');
  const payroll = await createPayrollRun({
    month: 'Baishakh 2083', academicYear: ACADEMIC_YEAR, createdBy: admin._id,
  }, null);
  await accruePayroll(payroll._id, { createdBy: admin._id }, null);
  await disbursePayroll(payroll._id, {
    paymentMethod: 'Bank Transfer', paidDate: BAISHAKH_30, createdBy: admin._id,
  }, null);
  const totalSalary = teachers.length * 25000;
  console.log(`    ✓ ${teachers.length} teachers paid NPR ${totalSalary.toLocaleString()} (Bank Transfer)\n`);

  // ── 12. Opening balance (1 Baishakh 2083) ────────────────────────────────
  console.log("🏦  Posting opening balance...");
  const [bankId, capitalId] = await Promise.all([acct('1120'), acct('3100')]);
  await postJournal({
    type: 'manual', source: 'manual', date: BAISHAKH_1,
    narration: "Owner's initial deposit — 1 Baishakh 2083",
    academicYear: ACADEMIC_YEAR,
    lines: [
      { account: bankId,    type: 'debit',  amount: 200000, description: 'Cash at Bank — opening deposit' },
      { account: capitalId, type: 'credit', amount: 200000, description: "Owner's Capital" },
    ],
    createdBy: admin._id,
  }, null);
  console.log("    ✓ Dr Cash at Bank 200,000 / Cr Owner's Capital 200,000\n");

  // ── 13. Expense journals (mid-Baishakh) ───────────────────────────────────
  console.log('🧾  Posting expenses...');
  const [rentId, utilId] = await Promise.all([acct('5210'), acct('5220')]);
  await postJournal({
    type: 'manual', source: 'manual', date: BAISHAKH_15,
    narration: 'Rent expense — Baishakh 2083',
    academicYear: ACADEMIC_YEAR,
    lines: [
      { account: rentId, type: 'debit',  amount: 15000, description: 'Monthly rent — Lalitpur' },
      { account: bankId, type: 'credit', amount: 15000, description: 'Cash at Bank' },
    ],
    createdBy: admin._id,
  }, null);
  await postJournal({
    type: 'manual', source: 'manual', date: BAISHAKH_15,
    narration: 'Electricity expense — Baishakh 2083',
    academicYear: ACADEMIC_YEAR,
    lines: [
      { account: utilId, type: 'debit',  amount: 5000, description: 'Electricity & water' },
      { account: bankId, type: 'credit', amount: 5000, description: 'Cash at Bank' },
    ],
    createdBy: admin._id,
  }, null);
  console.log('    ✓ Rent NPR 15,000 + Electricity NPR 5,000\n');

  // ── 14. Balance check ─────────────────────────────────────────────────────
  console.log('⚖️   Running balance check...\n');

  const journals  = await Journal.find({ academicYear: ACADEMIC_YEAR, status: 'posted' });
  const allAccts  = await Account.find({});
  const acctMap   = {};
  for (const a of allAccts) acctMap[a._id.toString()] = a;

  let totalDebit = 0, totalCredit = 0;
  let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0;

  for (const j of journals) {
    for (const line of j.lines) {
      if (line.type === 'debit')  totalDebit  += line.amount;
      if (line.type === 'credit') totalCredit += line.amount;

      const a = acctMap[line.account?.toString()];
      if (!a) continue;
      const amt = line.amount;
      if (a.type === 'asset')     assets      += line.type === 'debit'  ? amt : -amt;
      if (a.type === 'liability') liabilities += line.type === 'credit' ? amt : -amt;
      if (a.type === 'equity')    equity      += line.type === 'credit' ? amt : -amt;
      if (a.type === 'revenue')   revenue     += line.type === 'credit' ? amt : -amt;
      if (a.type === 'expense')   expenses    += line.type === 'debit'  ? amt : -amt;
    }
  }

  const netIncome     = revenue - expenses;
  const trialBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const bsBalanced    = Math.abs(assets - (liabilities + equity + netIncome)) < 1;

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('🎉  Demo school ready!');
  console.log(`    School:        Saraswati Public School`);
  console.log(`    Subdomain:     saraswati`);
  console.log(`    Admin login:   admin@saraswati.np / admin123`);
  console.log(`    Schoolcode:    saraswati  (for localhost)\n`);
  console.log(`    Students:      ${students.length} (across ${classes.length} classes)`);
  console.log(`    Teachers:      ${teachers.length}`);
  console.log(`    Fee paid:      ${paidStudents} students`);
  console.log(`    Fee partial:   ${partialStudents} students`);
  console.log(`    Fee unpaid:    ${unpaidStudents} students (overdue)`);
  console.log(`    Salaries paid: ${teachers.length} teachers (Baishakh 2083)\n`);
  console.log(`    Trial Balance: ${trialBalanced ? '✅ Balanced' : '❌ IMBALANCED'}  (Dr ${totalDebit.toLocaleString()} / Cr ${totalCredit.toLocaleString()})`);
  console.log(`    P&L:           Revenue ${revenue.toLocaleString()} — Expenses ${expenses.toLocaleString()} = Net ${netIncome.toLocaleString()}`);
  console.log(`    Balance Sheet: ${bsBalanced    ? '✅ Balanced' : '❌ IMBALANCED'}  (Assets ${Math.round(assets).toLocaleString()} = L+E+NI ${Math.round(liabilities + equity + netIncome).toLocaleString()})\n`);
  console.log(`    URL: http://saraswati.localhost:5173\n`);

  if (!trialBalanced) throw new Error('Trial Balance is imbalanced — check journal entries');
  if (!bsBalanced)    throw new Error('Balance Sheet is imbalanced — check journal entries');
});

await mongoose.disconnect();
process.exit(0);
