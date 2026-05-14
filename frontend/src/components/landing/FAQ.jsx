import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const ITEMS = [
  {
    q: 'Do I need any technical knowledge to use Wephas?',
    a: 'No. Wephas is designed for school administrators and teachers, not IT professionals. If you can use a smartphone, you can use Wephas.',
  },
  {
    q: "Is each school's data kept separate?",
    a: "Yes — every school runs in complete isolation. Saraswati Public School can never see data from another school, and vice versa. Each school gets its own private subdomain.",
  },
  {
    q: 'Does it support the Nepali academic calendar and NPR?',
    a: 'Yes. Wephas is built specifically for Nepal: NPR currency is native, and the academic year structure follows the Nepali system.',
  },
  {
    q: 'Can students and parents log in?',
    a: 'Yes. There are four separate portals: Admin, Teacher, Student, and Parent. Each role sees only what is relevant to them.',
  },
  {
    q: 'What happens after the 30-day trial?',
    a: 'Your data is preserved. You can upgrade to the School plan to continue, or request an extension. We will contact you before anything is locked.',
  },
  {
    q: 'Can we use our own domain (e.g. school.edu.np)?',
    a: 'Yes, custom domain pointing is available on the School and Enterprise plans. We will guide you through the DNS setup.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Wephas is a progressive web app (PWA) — it works in any mobile browser and can be installed to the home screen on Android and iOS without an app store download.',
  },
];

function Item({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-white/[0.08] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className={`font-medium text-sm transition-colors ${open ? 'text-white' : 'text-slate-300'}`}>{q}</span>
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
          open ? 'border-[#0ABAB5] bg-[#0ABAB5]/10 text-[#0ABAB5]' : 'border-white/20 text-slate-400'
        }`}>
          {open ? <Minus size={12} /> : <Plus size={12} />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-slate-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(0);
  const headRef   = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: '-80px' });

  return (
    <section id="faq" className="py-24 lg:py-32 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#0ABAB5]/10 border border-[#0ABAB5]/30 text-[#0ABAB5] text-xs font-semibold tracking-wide mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Questions? We have answers.
          </h2>
        </motion.div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 sm:px-8">
          {ITEMS.map((item, i) => (
            <Item
              key={item.q}
              q={item.q}
              a={item.a}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
