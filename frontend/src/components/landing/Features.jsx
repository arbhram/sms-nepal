import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Users, ClipboardList, CreditCard, BookOpen,
  BarChart2, Bell, Wallet, UserCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: 'Student Management',
    desc: 'Admissions, profiles, class assignments, and academic history — all in one place.',
    color: 'text-[#0ABAB5] bg-[#0ABAB5]/10',
  },
  {
    icon: ClipboardList,
    title: 'Attendance Tracking',
    desc: 'Daily attendance by class, teacher-wise marking, and instant absence reports.',
    color: 'text-sky-500 bg-sky-50',
  },
  {
    icon: CreditCard,
    title: 'Fee Management',
    desc: 'Custom fee structures, individual student assignments, payment records, and NPR-native due reports.',
    color: 'text-amber-500 bg-amber-50',
  },
  {
    icon: Wallet,
    title: 'Double-Entry Accounting',
    desc: 'Chart of accounts, journal entries, trial balance, P&L and balance sheet built in.',
    color: 'text-violet-500 bg-violet-50',
  },
  {
    icon: UserCheck,
    title: 'Payroll',
    desc: 'Monthly teacher payroll with allowances and deductions. One-click salary sheets.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: BookOpen,
    title: 'Exams & Gradebook',
    desc: 'Exam scheduling, marks entry, auto-GPA, and printable report cards per student.',
    color: 'text-pink-500 bg-pink-50',
  },
  {
    icon: Bell,
    title: 'Notice Board',
    desc: 'Post school-wide or class-specific notices. Students and parents see them instantly.',
    color: 'text-orange-500 bg-orange-50',
  },
  {
    icon: BarChart2,
    title: 'Reports & Analytics',
    desc: 'Dashboard overviews, fee collection trends, attendance summaries, and financial statements.',
    color: 'text-indigo-500 bg-indigo-50',
  },
];

function Card({ icon: Icon, title, desc, color, index }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07 }}
      className="rounded-2xl bg-white border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all group"
    >
      <div className={`inline-flex p-2.5 rounded-xl ${color} mb-4 transition-transform group-hover:scale-110`}>
        <Icon size={20} />
      </div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function Features() {
  const headRef    = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: '-80px' });

  return (
    <section id="features" className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#0ABAB5]/10 border border-[#0ABAB5]/20 text-[#0ABAB5] text-xs font-semibold tracking-wide mb-4">
            Everything you need
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            One platform. Zero chaos.
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Every feature a school needs, built together so they actually talk to each other.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <Card key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
