import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Trial',
    price: 'Free',
    period: '30 days',
    desc: 'Full access to explore everything. No credit card.',
    highlight: false,
    features: [
      'All features unlocked',
      'Up to 50 students',
      'Email support',
      'Your own subdomain',
    ],
    cta: { label: 'Start Free Trial', to: '/request-demo' },
  },
  {
    name: 'School',
    price: 'NPR 999',
    period: 'per month',
    desc: 'For schools ready to go live. Scales with your enrolment.',
    highlight: true,
    features: [
      'Unlimited students',
      'All modules included',
      'Priority support',
      'Custom domain (optional)',
      'Regular feature updates',
    ],
    cta: { label: 'Request Demo', to: '/request-demo' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'tailored pricing',
    desc: 'Multiple campuses, group reporting, or special requirements.',
    highlight: false,
    features: [
      'Multi-campus support',
      'Dedicated onboarding',
      'SLA & data export',
      'Custom integrations',
    ],
    cta: { label: 'Contact Us', to: '/request-demo' },
  },
];

function PlanCard({ plan, index }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative rounded-2xl border p-7 flex flex-col gap-6 ${
        plan.highlight
          ? 'border-[#0ABAB5]/50 bg-[#0ABAB5]/5 ring-1 ring-[#0ABAB5]/20'
          : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      {plan.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0ABAB5] text-white text-xs font-bold whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{plan.name}</p>
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-4xl font-extrabold text-white">{plan.price}</span>
          <span className="text-slate-500 text-sm">{plan.period}</span>
        </div>
        <p className="text-slate-400 text-sm">{plan.desc}</p>
      </div>

      <ul className="space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
            <Check size={14} className="text-[#0ABAB5] flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        to={plan.cta.to}
        className={`block text-center px-5 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
          plan.highlight
            ? 'bg-[#0ABAB5] text-white hover:bg-[#09a8a3] shadow-lg shadow-[#0ABAB5]/25'
            : 'border border-white/20 text-white hover:border-white/40 hover:bg-white/5'
        }`}
      >
        {plan.cta.label}
      </Link>
    </motion.div>
  );
}

export default function Pricing() {
  const headRef    = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: '-80px' });

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#0ABAB5]/10 border border-[#0ABAB5]/30 text-[#0ABAB5] text-xs font-semibold tracking-wide mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Simple, transparent plans
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Start free. Upgrade when you're ready. No hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
