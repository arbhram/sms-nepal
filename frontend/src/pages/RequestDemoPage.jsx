import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import Nav from '../components/landing/Nav.jsx';

export default function RequestDemoPage() {
  const [form, setForm]         = useState({ name: '', email: '', school: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 pt-32 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to home
        </Link>

        {submitted ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Request received!</h2>
            <p className="text-slate-500">We'll reach out within 1 business day to schedule your demo.</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Request a Demo</h1>
            <p className="text-slate-500 mb-8">Tell us about your school and we'll set up a personalised walkthrough.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: 'name',   label: 'Your Name',        type: 'text',  placeholder: 'Ram Bahadur'              },
                { name: 'email',  label: 'Email',            type: 'email', placeholder: 'ram@school.edu.np'         },
                { name: 'school', label: 'School Name',      type: 'text',  placeholder: 'Saraswati Secondary School' },
                { name: 'phone',  label: 'Phone (optional)', type: 'tel',   placeholder: '+977 98XXXXXXXX'           },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required={f.name !== 'phone'}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0ABAB5] focus:ring-2 focus:ring-[#0ABAB5]/20 transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Anything you'd like us to know?</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Current software, number of students, specific needs…"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0ABAB5] focus:ring-2 focus:ring-[#0ABAB5]/20 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0ABAB5] text-white font-semibold text-sm hover:bg-[#09a8a3] transition-all hover:shadow-lg hover:shadow-[#0ABAB5]/25 active:scale-95 mt-2"
              >
                <Send size={15} />
                Send Request
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
