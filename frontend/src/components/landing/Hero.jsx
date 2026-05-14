import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.11 } } };

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-0 -translate-y-6 blur-3xl bg-[#0ABAB5]/10 rounded-3xl" />
      <div className="relative rounded-2xl border border-white/10 bg-[#0D1220]/80 backdrop-blur-sm overflow-hidden shadow-2xl">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-4 h-5 rounded-md bg-white/10 text-xs text-slate-400 flex items-center px-3">
            saraswati.wephas.com/dashboard
          </div>
        </div>

        {/* Stat cards */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Students',  value: '284',      color: 'text-[#0ABAB5]' },
            { label: 'Fees Due',  value: 'NPR 1.2L', color: 'text-amber-400' },
            { label: 'Teachers',  value: '18',        color: 'text-violet-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Recent Activity</p>
          {[
            { name: 'Aarav Sharma',  action: 'Fee paid',      cls: 'bg-[#0ABAB5]/15 text-[#0ABAB5]'  },
            { name: 'Priya Thapa',   action: 'Absent today',  cls: 'bg-red-500/15 text-red-400'       },
            { name: 'Rohan KC',      action: 'New admission', cls: 'bg-amber-500/15 text-amber-400'   },
            { name: 'Class X-B',     action: 'Exam added',    cls: 'bg-violet-500/15 text-violet-400' },
          ].map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/[0.03] border border-white/[0.06]">
              <span className="text-sm text-slate-200">{r.name}</span>
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
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#0ABAB5]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0ABAB5]/10 border border-[#0ABAB5]/30 text-[#0ABAB5] text-xs font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ABAB5] animate-pulse" />
                Built for Nepali Schools
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-white leading-[1.1] tracking-tight">
              Run your school.<br />
              <span className="text-[#0ABAB5]">Not spreadsheets.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-slate-400 leading-relaxed max-w-md">
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-slate-300 font-medium text-sm hover:border-white/30 hover:text-white transition-all active:scale-95"
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
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                  {i < 2 && <div className="w-px h-8 bg-white/10" />}
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600"
      >
        <ChevronDown size={20} className="animate-bounce" />
      </motion.div>
    </section>
  );
}
