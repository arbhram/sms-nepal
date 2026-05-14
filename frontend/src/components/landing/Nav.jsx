import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_LINKS = [
  { label: 'Features',      href: '#features' },
  { label: 'How it works',  href: '#how-it-works' },
  { label: 'Pricing',       href: '#pricing' },
  { label: 'FAQ',           href: '#faq' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user }                = useAuth();
  const navigate                = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(href) {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  }

  function dashboardPath() {
    if (!user) return null;
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    if (user.role === 'parent')  return '/parent/dashboard';
    return '/dashboard';
  }

  const dest = dashboardPath();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0A0E1A]/95 backdrop-blur-md shadow-lg shadow-black/30' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <img src="/wephas-icon.svg" alt="Wephas" className="w-8 h-8" />
            <span className="font-bold text-white text-lg tracking-tight">wephas</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                onClick={() => scrollTo(href)}
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {dest ? (
              <button
                onClick={() => navigate(dest)}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0ABAB5] rounded-lg hover:bg-[#09a8a3] transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link
                  to="/request-demo"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0ABAB5] rounded-lg hover:bg-[#09a8a3] transition-colors shadow-md shadow-[#0ABAB5]/20"
                >
                  Request Demo
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden text-slate-300 hover:text-white transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-[#0D1220]/98 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-4 flex flex-col gap-4">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                onClick={() => scrollTo(href)}
                className="text-left text-slate-300 hover:text-white text-sm font-medium py-1 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              {dest ? (
                <button
                  onClick={() => { setMenuOpen(false); navigate(dest); }}
                  className="w-full px-4 py-2 text-sm font-semibold text-white bg-[#0ABAB5] rounded-lg hover:bg-[#09a8a3] transition-colors"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="text-slate-300 hover:text-white text-sm font-medium py-1">
                    Log in
                  </Link>
                  <Link to="/request-demo" onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 text-sm font-semibold text-white bg-[#0ABAB5] rounded-lg hover:bg-[#09a8a3] text-center block">
                    Request Demo
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
