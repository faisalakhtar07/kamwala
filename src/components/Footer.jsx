import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

// Replace this with the developer's actual portfolio/website URL.
const DEVELOPER_PORTFOLIO_URL = 'https://myportfolio-nine-beta-60.vercel.app/';

const CUSTOMER_LINKS = [
  { label: 'Browse categories', to: '/categories' },
  { label: 'Ask KamWala AI', to: '/ai-chat' },
  { label: 'My requests', to: '/dashboard' },
  { label: 'My profile', to: '/profile' },
];

const WORKER_LINKS = [
  { label: 'Become a worker', to: '/register' },
  { label: 'How assignments work', to: '/#how-it-works' },
  { label: 'Worker support', to: '/#become-a-worker' },
];

const COMPANY_LINKS = [
  { label: 'About KamWala', to: '/#why-kamwala' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Contact support', to: '/#become-a-worker' },
];

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-cloud-100">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-14 pb-8">
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-brand-500 flex items-center justify-center text-white font-display font-bold text-sm">
                K
              </div>
              <span className="font-display font-bold text-lg text-white">KamWala</span>
            </div>
            <p className="text-sm text-cloud-100/70 mt-3 max-w-xs leading-relaxed">
              Kaam Bataye, KamWala Sambhale. Tell us what work you need done — we manage the
              booking, arrange a trusted worker, and keep everything on one platform.
            </p>
          </div>

          <div>
            <p className="font-display font-semibold text-sm text-white mb-3">Company</p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.to} className="text-sm text-cloud-100/70 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-display font-semibold text-sm text-white mb-3">For customers</p>
            <ul className="space-y-2.5">
              {CUSTOMER_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-cloud-100/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-display font-semibold text-sm text-white mb-3">For workers</p>
            <ul className="space-y-2.5 mb-5">
              {WORKER_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-cloud-100/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="font-display font-semibold text-sm text-white mb-2.5">Contact</p>
            <ul className="space-y-2 text-sm text-cloud-100/70">
              <li className="flex items-center gap-2">
                <Phone size={13} className="shrink-0" /> +91 90000 00000
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="shrink-0" /> support@kamwala.in
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={13} className="shrink-0 mt-0.5" /> Aurangabad, Bihar, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cloud-100/60">© {new Date().getFullYear()} KamWala. All rights reserved.</p>
          <a
            href={DEVELOPER_PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cloud-100/40 hover:text-cloud-100/70 transition-colors"
          >
            Built with care by the developer
          </a>
        </div>
      </div>
    </footer>
  );
}
