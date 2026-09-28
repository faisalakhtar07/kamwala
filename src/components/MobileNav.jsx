import { NavLink } from 'react-router-dom';
import { Home, Grid3x3, Bot, ClipboardList, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LINKS = [
  { to: '/', key: 'nav.home', icon: Home, end: true },
  { to: '/categories', key: 'nav.categories', icon: Grid3x3 },
  { to: '/ai-chat', key: 'nav.askAI', icon: Bot },
  { to: '/dashboard', key: 'nav.requests', icon: ClipboardList },
  { to: '/profile', key: 'nav.profile', icon: User },
];

export default function MobileNav() {
  const { t } = useLanguage();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-cloud-200 flex items-stretch h-16 pb-[env(safe-area-inset-bottom)]">
      {LINKS.map(({ to, key, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              isActive ? 'text-brand-600' : 'text-ink-500'
            }`
          }
        >
          <Icon size={20} />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  );
}
