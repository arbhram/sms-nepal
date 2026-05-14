import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, School } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSchool } from '../../context/SchoolContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const { school } = useSchool();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPass, setShowPass] = useState(false);

  // schoolCode input is only needed when there's no subdomain (bare localhost dev)
  const needsSchoolCode = !school;

  // Pre-fill school code from ?school= query param (set by FindSchoolPage on localhost)
  const prefilledSchool = searchParams.get('school') || 'myschool';

  const formik = useFormik({
    initialValues: { schoolCode: prefilledSchool, email: '', password: '' },
    validationSchema: Yup.object({
      schoolCode: needsSchoolCode ? Yup.string().required('Required') : Yup.string(),
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6).required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const data = await login(values.email, values.password, needsSchoolCode ? values.schoolCode : undefined);
        toast.success('Welcome back!');
        if (data.role === 'student') navigate('/student/dashboard');
        else if (data.role === 'teacher') navigate('/teacher/dashboard');
        else if (data.role === 'parent') navigate('/parent/dashboard');
        else navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg, #ddeeff 0%, #eef5ff 50%, #e8f0fe 100%)' }}
    >
      {/* Soft background blobs */}
      <div
        className="absolute top-0 left-0 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(12,127,255,0.1) 0%, transparent 70%)', transform: 'translate(-35%, -35%)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,68,143,0.08) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[880px] rounded-[28px] flex overflow-hidden"
        style={{ minHeight: 520, boxShadow: '0 24px 80px rgba(12,63,143,0.14), 0 4px 16px rgba(0,0,0,0.06)' }}
      >

        {/* ── LEFT — Brand blue illustration panel ── */}
        <div
          className="hidden md:flex w-[44%] flex-col items-center justify-center relative overflow-hidden p-8"
          style={{ background: 'linear-gradient(160deg, #0c7fff 0%, #0063db 55%, #004fb0 100%)' }}
        >
          {/* Decorative rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/[0.06] pointer-events-none" />

          {/* Floating dots */}
          <div className="absolute top-8 right-12 w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="absolute top-20 left-8 w-1.5 h-1.5 rounded-full bg-white/15" />
          <div className="absolute bottom-16 right-8 w-2 h-2 rounded-full bg-white/20" />
          <div className="absolute bottom-28 left-14 w-1.5 h-1.5 rounded-full bg-white/15" />
          <div className="absolute top-1/3 right-6 w-1 h-1 rounded-full bg-white/25" />

          {/* Illustration */}
          <svg width="280" height="280" viewBox="0 0 280 280" fill="none" className="relative z-10">

            {/* Ground glow */}
            <ellipse cx="140" cy="232" rx="90" ry="16" fill="white" fillOpacity="0.1" />

            {/* ── Books stack ── */}
            {/* Book 3 — warm */}
            <rect x="60" y="194" width="96" height="22" rx="4" fill="white" fillOpacity="0.25" />
            <rect x="60" y="194" width="13" height="22" rx="2" fill="white" fillOpacity="0.35" />
            <rect x="62" y="196" width="9" height="18" rx="1.5" fill="white" fillOpacity="0.5" />
            <line x1="82" y1="197" x2="148" y2="197" stroke="white" strokeWidth="1" strokeOpacity="0.15" />
            <line x1="82" y1="201" x2="142" y2="201" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
            {/* Book 2 */}
            <rect x="64" y="174" width="88" height="22" rx="4" fill="white" fillOpacity="0.18" />
            <rect x="64" y="174" width="13" height="22" rx="2" fill="white" fillOpacity="0.28" />
            <rect x="66" y="176" width="9" height="18" rx="1.5" fill="white" fillOpacity="0.4" />
            {/* Book 1 */}
            <rect x="68" y="156" width="80" height="20" rx="4" fill="white" fillOpacity="0.30" />
            <rect x="68" y="156" width="13" height="20" rx="2" fill="white" fillOpacity="0.42" />
            <rect x="70" y="158" width="9" height="16" rx="1.5" fill="white" fillOpacity="0.6" />
            <line x1="90" y1="159" x2="140" y2="159" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="90" y1="163" x2="134" y2="163" stroke="white" strokeWidth="1" strokeOpacity="0.15" />

            {/* ── Graduation cap ── */}
            <ellipse cx="148" cy="106" rx="55" ry="10" fill="white" fillOpacity="0.1" />
            {/* Board top face */}
            <path d="M92 88 L148 68 L204 88 L148 108 Z" fill="white" fillOpacity="0.9" />
            {/* Board underside */}
            <path d="M92 88 L148 108 L148 102 L92 82 Z" fill="white" fillOpacity="0.55" />
            {/* Highlight edge */}
            <path d="M100 85 L148 68 L196 85 L148 102 Z" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.4" />
            {/* Center button */}
            <circle cx="148" cy="88" r="5" fill="#004fb0" />
            <circle cx="148" cy="88" r="3" fill="#0063db" />
            {/* Tassel */}
            <line x1="148" y1="88" x2="180" y2="94" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="180" y1="94" x2="180" y2="116" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <rect x="175" y="116" width="10" height="3" rx="1.5" fill="#f59e0b" />
            <line x1="175" y1="119" x2="173" y2="130" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="177" y1="119" x2="177" y2="131" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="179" y1="119" x2="181" y2="130" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="181" y1="119" x2="183" y2="129" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            {/* Cap cylinder */}
            <path d="M122 102 L122 124 Q148 134 174 124 L174 102 Q148 112 122 102 Z" fill="white" fillOpacity="0.65" />
            <path d="M122 102 Q148 112 174 102 Q148 114 122 102 Z" fill="white" fillOpacity="0.3" />

            {/* ── Pencil ── */}
            <g transform="rotate(-30, 212, 152)">
              <rect x="204" y="110" width="16" height="72" rx="2" fill="#fbbf24" />
              <rect x="204" y="110" width="16" height="9" rx="2" fill="#e5e7eb" />
              <rect x="204" y="117" width="16" height="4" fill="#9ca3af" />
              <path d="M204 182 L212 198 L220 182 Z" fill="#fde68a" />
              <path d="M207 182 L212 198 L217 182 Z" fill="#451a03" />
              <rect x="206" y="124" width="3" height="52" rx="1.5" fill="white" fillOpacity="0.3" />
            </g>

            {/* ── Diploma scroll ── */}
            <g transform="translate(178, 36) rotate(10)">
              <rect x="0" y="6" width="50" height="36" rx="2" fill="white" fillOpacity="0.92" />
              <ellipse cx="25" cy="6" rx="25" ry="5" fill="white" fillOpacity="0.75" />
              <ellipse cx="25" cy="42" rx="25" ry="5" fill="white" fillOpacity="0.75" />
              <ellipse cx="25" cy="6" rx="21" ry="3.5" fill="white" fillOpacity="0.92" />
              <rect x="21" y="0" width="8" height="48" rx="2" fill="#dc2626" fillOpacity="0.7" />
              <line x1="6" y1="18" x2="44" y2="18" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="24" x2="44" y2="24" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
              <line x1="6" y1="29" x2="44" y2="29" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
              <circle cx="25" cy="24" r="6" fill="#fbbf24" />
              <text x="25" y="27.5" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">★</text>
            </g>

            {/* ── Sparkles ── */}
            <g transform="translate(44, 54)">
              <line x1="0" y1="-7" x2="0" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
              <line x1="-7" y1="0" x2="7" y2="0" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
              <line x1="-4" y1="-4" x2="4" y2="4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.35" />
              <line x1="4" y1="-4" x2="-4" y2="4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.35" />
            </g>
            <g transform="translate(170, 168)">
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            <circle cx="52" cy="142" r="2.5" fill="white" fillOpacity="0.25" />
            <circle cx="60" cy="134" r="1.5" fill="white" fillOpacity="0.2" />
            <circle cx="236" cy="62" r="2" fill="white" fillOpacity="0.25" />
          </svg>

          {/* Caption */}
          <p className="relative z-10 text-white/50 text-[11px] tracking-widest uppercase mt-1">
            School Management System
          </p>

          {/* Brand mark top-left */}
          <div className="absolute top-5 left-5 flex items-center gap-2 z-10">
            <div
              className="h-8 px-2 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <img src="/wephas-icon.svg" alt="wePhas" className="h-5 brightness-0 invert" />
            </div>
          </div>
        </div>

        {/* ── RIGHT — White form panel ── */}
        <div className="flex-1 flex flex-col justify-center px-10 py-14 relative bg-white">

          {/* Top-right logo badge */}
          <div
            className="absolute top-0 right-0 w-20 h-14 flex items-center justify-center rounded-bl-2xl"
            style={{ background: '#eef5ff', borderLeft: '1px solid #dbeafe', borderBottom: '1px solid #dbeafe' }}
          >
            <img src="/wephas-icon.svg" alt="wePhas" className="h-7" />
          </div>

          <div className="max-w-[300px] w-full mx-auto">

            <h1 className="text-[30px] font-display font-bold text-slate-900 mb-1.5 leading-tight">
              {school ? school.name : 'Welcome!'}
            </h1>
            <p className="text-sm text-slate-400 mb-9">Login to your account</p>

            <form onSubmit={formik.handleSubmit} className="space-y-4">

              {/* School code — only shown when no subdomain is detected (bare localhost) */}
              {needsSchoolCode && (
                <>
                  <div className="flex items-center gap-3 rounded-full px-5 py-3.5 bg-slate-50 border border-slate-200 transition-all focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
                    <School size={15} className="text-slate-400 flex-shrink-0" />
                    <input
                      name="schoolCode"
                      type="text"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.schoolCode}
                      placeholder="School code"
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                    />
                  </div>
                  {formik.errors.schoolCode && formik.touched.schoolCode && (
                    <p className="text-[11px] text-rose-500 -mt-2 pl-5">{formik.errors.schoolCode}</p>
                  )}
                </>
              )}

              {/* Email */}
              <div className="flex items-center gap-3 rounded-full px-5 py-3.5 bg-slate-50 border border-slate-200 transition-all focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
                <Mail size={15} className="text-slate-400 flex-shrink-0" />
                <input
                  name="email"
                  type="email"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                  placeholder="Email"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>
              {formik.errors.email && formik.touched.email && (
                <p className="text-[11px] text-rose-500 -mt-2 pl-5">{formik.errors.email}</p>
              )}

              {/* Password */}
              <div className="flex items-center gap-3 rounded-full px-5 py-3.5 bg-slate-50 border border-slate-200 transition-all focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
                <Lock size={15} className="text-slate-400 flex-shrink-0" />
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {formik.errors.password && formik.touched.password && (
                <p className="text-[11px] text-rose-500 -mt-2 pl-5">{formik.errors.password}</p>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full rounded-full py-3.5 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
                style={{
                  background: 'linear-gradient(135deg, #0c7fff 0%, #0063db 100%)',
                  boxShadow: '0 4px 20px rgba(12,127,255,0.35)',
                }}
              >
                {formik.isSubmitting ? 'Signing in…' : 'Login'}
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
}
