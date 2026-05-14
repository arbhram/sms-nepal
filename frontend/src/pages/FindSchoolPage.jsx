import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, School } from 'lucide-react';
import Nav from '../components/landing/Nav.jsx';

function redirectToSchool(subdomain) {
  const hostname = window.location.hostname;
  const isLocal  = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocal) {
    // On local dev, stay on same host and pass school code as query param
    window.location.href = `/login?school=${encodeURIComponent(subdomain)}`;
  } else {
    // On production derive root domain: wephas.com → saraswati.wephas.com
    const rootDomain = hostname.split('.').slice(-2).join('.');
    window.location.href = `https://${subdomain}.${rootDomain}/login`;
  }
}

export default function FindSchoolPage() {
  const [subdomain, setSubdomain] = useState('');
  const [error, setError]         = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const clean = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean) { setError('Please enter your school code.'); return; }
    redirectToSchool(clean);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Nav />
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-16">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
            {/* Icon */}
            <div className="inline-flex p-3 rounded-xl bg-[#0ABAB5]/10 text-[#0ABAB5] mb-6">
              <School size={24} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-1">Find your school</h1>
            <p className="text-slate-500 text-sm mb-8">
              Enter the school code your administrator gave you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">School code</label>
                <div className="flex items-center rounded-xl border border-slate-200 focus-within:border-[#0ABAB5] focus-within:ring-2 focus-within:ring-[#0ABAB5]/20 transition-all overflow-hidden bg-slate-50">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => { setSubdomain(e.target.value); setError(''); }}
                    placeholder="e.g. saraswati"
                    autoFocus
                    className="flex-1 px-4 py-3 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                  />
                  <span className="pr-4 text-sm text-slate-400 select-none whitespace-nowrap">.wephas.com</span>
                </div>
                {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0ABAB5] text-white font-semibold text-sm hover:bg-[#09a8a3] transition-all hover:shadow-lg hover:shadow-[#0ABAB5]/25 active:scale-95"
              >
                Go to login <ArrowRight size={15} />
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Don't know your school code?{' '}
              <Link to="/request-demo" className="text-[#0ABAB5] hover:underline font-medium">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
