import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import axios from 'axios';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6).required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { data } = await axios.post('/api/superadmin/login', values);
        localStorage.setItem('superAdminToken', data.token);
        localStorage.setItem('superAdminUser', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
        toast.success(`Welcome, ${data.name}`);
        navigate('/superadmin/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
    >
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Super Admin</h1>
          <p className="text-sm text-slate-400 mt-1">Platform management console</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/10 focus-within:border-amber-500/50">
              <Mail size={15} className="text-slate-400 flex-shrink-0" />
              <input
                name="email"
                type="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                placeholder="Email"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
            {formik.errors.email && formik.touched.email && (
              <p className="text-[11px] text-rose-400 mt-1 pl-1">{formik.errors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/10 focus-within:border-amber-500/50">
              <Lock size={15} className="text-slate-400 flex-shrink-0" />
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                placeholder="Password"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="text-slate-400 hover:text-slate-300 transition flex-shrink-0"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {formik.errors.password && formik.touched.password && (
              <p className="text-[11px] text-rose-400 mt-1 pl-1">{formik.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full rounded-xl py-3 text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 transition disabled:opacity-60 mt-2"
          >
            {formik.isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
