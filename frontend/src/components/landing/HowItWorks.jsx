import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { School, Database, LayoutDashboard } from 'lucide-react';

const STEPS = [
  {
    Icon: School,
    number: '01',
    title: 'We set up your school',
    desc: 'Share your school name and we create a private subdomain (e.g. saraswati.wephas.com) with your admin account ready to go. Takes under 10 minutes.',
  },
  {
    Icon: Database,
    number: '02',
    title: 'Add your data',
    desc: 'Import students, add teachers, define classes and fee structures. We provide a guided setup — no spreadsheet exports needed.',
  },
  {
    Icon: LayoutDashboard,
    number: '03',
    title: 'Run everything from one dashboard',
    desc: 'Attendance, fees, payroll, exams, and reports — your whole school administration in one tab. Staff and parents get their own logins.',
  },
];

function Step({ Icon, number, title, desc, index }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-[#0ABAB5]/10 border-2 border-[#0ABAB5]/20 flex items-center justify-center">
          <Icon size={28} className="text-[#0ABAB5]" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-[#0ABAB5]/40 flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-bold text-[#0ABAB5]">{number}</span>
        </div>
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{desc}</p>
    </motion.div>
  );
}

export default function HowItWorks() {
  const headRef    = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#0ABAB5]/10 border border-[#0ABAB5]/20 text-[#0ABAB5] text-xs font-semibold tracking-wide mb-4">
            Getting started
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Up and running in a day
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            No servers to set up, no software to install. We handle the technical side so you focus on your school.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-[#0ABAB5]/20 via-[#0ABAB5]/50 to-[#0ABAB5]/20" />
          {STEPS.map((step, i) => (
            <Step key={step.number} {...step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
