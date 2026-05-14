import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, X } from 'lucide-react';

const COMPARISON = [
  { feature: 'Nepal NPR currency & academic calendar', wephas: true,  old: false },
  { feature: "Each school's data fully isolated",      wephas: true,  old: false },
  { feature: 'Student + teacher + parent portals',     wephas: true,  old: false },
  { feature: 'Built-in double-entry accounting',       wephas: true,  old: false },
  { feature: 'No IT team or server needed',            wephas: true,  old: false },
  { feature: 'Works on any device / browser',          wephas: true,  old: false },
  { feature: 'Manual data entry & version conflicts',  wephas: false, old: true  },
  { feature: 'Lost files, shared Excel chaos',         wephas: false, old: true  },
];

export default function WhyWephas() {
  const headRef    = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: '-80px' });
  const tableRef   = useRef(null);
  const tableInView = useInView(tableRef, { once: true, margin: '-80px' });

  return (
    <section className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#0ABAB5]/10 border border-[#0ABAB5]/20 text-[#0ABAB5] text-xs font-semibold tracking-wide mb-4">
            Why Wephas
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Ditch the spreadsheets for good
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            See how Wephas compares to the way most Nepali schools manage things today.
          </p>
        </motion.div>

        <motion.div
          ref={tableRef}
          initial={{ opacity: 0, y: 24 }}
          animate={tableInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm"
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
            <div className="py-4 px-6 text-sm font-semibold text-slate-500">Feature</div>
            <div className="py-4 px-6 text-sm font-semibold text-[#0ABAB5] text-center border-l border-slate-200 bg-[#0ABAB5]/5">
              <div className="flex items-center justify-center gap-2">
                <img src="/wephas-icon.svg" alt="" className="w-5 h-5" />
                Wephas
              </div>
            </div>
            <div className="py-4 px-6 text-sm font-semibold text-slate-400 text-center border-l border-slate-200">
              Spreadsheets / manual
            </div>
          </div>

          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
            >
              <div className="py-3.5 px-6 text-sm text-slate-700 flex items-center">{row.feature}</div>
              <div className="py-3.5 px-6 flex items-center justify-center border-l border-slate-100 bg-[#0ABAB5]/[0.02]">
                {row.wephas
                  ? <Check size={16} className="text-[#0ABAB5]" />
                  : <X size={16} className="text-slate-300" />}
              </div>
              <div className="py-3.5 px-6 flex items-center justify-center border-l border-slate-100">
                {row.old
                  ? <Check size={16} className="text-slate-400" />
                  : <X size={16} className="text-red-400" />}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
