import { Link } from 'react-router-dom';

const LINKS = {
  Product: [
    { label: 'Features',     href: '#features',    scroll: true  },
    { label: 'How it works', href: '#how-it-works', scroll: true  },
    { label: 'Pricing',      href: '#pricing',      scroll: true  },
    { label: 'Request Demo', href: '/request-demo', scroll: false },
  ],
  Account: [
    { label: 'Log in',       href: '/login',  scroll: false },
  ],
  System: [
    { label: 'Super Admin',  href: '/superadmin/login', scroll: false },
  ],
};

function scrollTo(href) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img src="/wephas-icon.svg" alt="Wephas" className="w-8 h-8" />
              <span className="font-bold text-slate-900 text-lg tracking-tight">wephas</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              School management built for Nepal — students, fees, accounting and more in one private system per school.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.scroll ? (
                      <button
                        onClick={() => scrollTo(item.href)}
                        className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link to={item.href} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Wephas. All rights reserved.</p>
          <p className="text-xs text-slate-400">Made with ♥ for Nepali schools</p>
        </div>
      </div>
    </footer>
  );
}
