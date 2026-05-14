import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border border-[#0ABAB5]/20 bg-gradient-to-br from-[#0ABAB5]/8 via-white to-indigo-50/50 overflow-hidden p-10 sm:p-16 text-center shadow-xl shadow-[#0ABAB5]/5"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0ABAB5]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-100 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <span className="inline-block px-3 py-1 rounded-full bg-[#0ABAB5]/10 border border-[#0ABAB5]/20 text-[#0ABAB5] text-xs font-semibold tracking-wide mb-6">
              30-day free trial · No credit card
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
              Ready to modernise<br />your school?
            </h2>
            <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto">
              Join schools across Nepal that have moved from spreadsheets to Wephas. Request a personalised demo and we'll have you set up within a day.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/request-demo"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#0ABAB5] text-white font-semibold text-sm hover:bg-[#09a8a3] transition-all hover:shadow-xl hover:shadow-[#0ABAB5]/30 active:scale-95"
              >
                Request a Demo <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
              >
                Log in to your school
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
