import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.11 } } };

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-0 -translate-y-4 blur-3xl bg-[#0ABAB5]/10 rounded-3xl" />
      <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xl">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 mx-4 h-5 rounded-md bg-slate-200 text-xs text-slate-500 flex items-center px-3">
            saraswati.wephas.com/dashboard
          </div>
        </div>

        {/* Stat cards */}
        <div className="p-4 grid grid-cols-3 gap-3 bg-slate-50">
          {[
            { label: 'Students',  value: '284',      color: 'text-[#0ABAB5]' },
            { label: 'Fees Due',  value: 'NPR 1.2L', color: 'text-amber-500' },
            { label: 'Teachers',  value: '18',        color: 'text-violet-500' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="px-4 pb-4 pt-2 space-y-2 bg-slate-50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Recent Activity</p>
          {[
            { name: 'Aarav Sharma',  action: 'Fee paid',      cls: 'bg-[#0ABAB5]/10 text-[#0ABAB5]'  },
            { name: 'Priya Thapa',   action: 'Absent today',  cls: 'bg-red-50 text-red-500'           },
            { name: 'Rohan KC',      action: 'New admission', cls: 'bg-amber-50 text-amber-600'       },
            { name: 'Class X-B',     action: 'Exam added',    cls: 'bg-violet-50 text-violet-600'     },
          ].map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white border border-slate-100">
              <span className="text-sm text-slate-700">{r.name}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.cls}`}>{r.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16 bg-gradient-to-b from-slate-50 to-white">
      {/* Subtle background shape */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0ABAB5]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0ABAB5]/10 border border-[#0ABAB5]/20 text-[#0ABAB5] text-xs font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ABAB5] animate-pulse" />
                Built for Nepali Schools
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Run your school.<br />
              <span className="text-[#0ABAB5]">Not spreadsheets.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-slate-500 leading-relaxed max-w-md">
              Wephas gives every school its own private system — students, attendance,
              fees, accounting, payroll and reports in one place. No IT team needed.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/request-demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0ABAB5] text-white font-semibold text-sm hover:bg-[#09a8a3] transition-all hover:shadow-lg hover:shadow-[#0ABAB5]/30 active:scale-95"
              >
                Request a Demo <ArrowRight size={15} />
              </Link>
              <button
                onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
              >
                See Features
              </button>
            </motion.div>

            {/* Trust bar */}
            <motion.div variants={fadeUp} className="flex items-center gap-6 pt-2">
              {[
                { value: '50+',  label: 'Schools'          },
                { value: '10k+', label: 'Students managed' },
                { value: 'NPR',  label: 'Native currency'  },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                  {i < 2 && <div className="w-px h-8 bg-slate-200" />}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-300"
      >
        <ChevronDown size={20} className="animate-bounce" />
      </motion.div>
    </section>
  );
}
