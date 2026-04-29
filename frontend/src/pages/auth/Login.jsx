import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const formik = useFormik({
    initialValues: { email: 'admin@sms.np', password: 'admin123' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6, 'Min 6 characters').required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const data = await login(values.email, values.password);
        toast.success('Welcome back!');
        if (data.role === 'student') navigate('/student/dashboard');
        else if (data.role === 'teacher') navigate('/teacher/dashboard');
        else navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-brand relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent-500/40 blur-3xl" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs font-semibold uppercase tracking-wider mb-6">
            <GraduationCap size={14} /> SMS Nepal
          </div>
          <h1 className="text-5xl font-display font-bold leading-[1.05] tracking-tight mb-4">
            Run your school<br />with clarity.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            A modern student management system built for Nepali schools, colleges, and tuition
            centers. Students, fees, attendance, exams — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { k: '10k+', v: 'Students' },
              { k: '500+', v: 'Institutes' },
              { k: '99.9%', v: 'Uptime' },
            ].map((s) => (
              <div key={s.v} className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                <div className="text-2xl font-display font-bold">{s.k}</div>
                <div className="text-xs text-white/70 uppercase tracking-wider">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold">
                SN
              </div>
              <span className="font-display font-bold text-lg">SMS Nepal</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-2">Sign in to your admin account to continue.</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="email"
                  type="email"
                  onChange={formik.handleChange}
                  value={formik.values.email}
                  className="input pl-10"
                  placeholder="you@school.edu.np"
                />
              </div>
              {formik.errors.email && (
                <p className="text-xs text-rose-500 mt-1">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  onChange={formik.handleChange}
                  value={formik.values.password}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formik.errors.password && (
                <p className="text-xs text-rose-500 mt-1">{formik.errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="btn-primary w-full py-3"
            >
              {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="text-center text-xs text-slate-500 pt-4 border-t">
              Demo credentials: <span className="font-semibold text-slate-700">admin@sms.np / admin123</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
