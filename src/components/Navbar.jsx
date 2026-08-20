import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-cloud-200 h-16 hidden md:flex items-center px-8 gap-8">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-display font-bold text-sm">K</div>
        <span className="font-display font-bold text-base">KamWala</span>
      </Link>

      <nav className="flex items-center gap-6 text-sm font-medium text-ink-700">
        <Link to="/categories" className="hover:text-ink-900">Categories</Link>
        <Link to="/ai-chat" className="hover:text-ink-900">Ask KamWala AI</Link>
        <Link to="/dashboard" className="hover:text-ink-900">My Requests</Link>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <Link to="/notifications" className="h-10 w-10 rounded-full bg-cloud-50 border border-cloud-200 flex items-center justify-center hover:bg-cloud-100" aria-label="Notifications">
          <Bell size={18} className="text-ink-700" />
        </Link>
        {user ? (
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-rose-500"
          >
            <LogOut size={16} /> Log out
          </button>
        ) : (
          <>
            <Link to="/login" className="text-sm font-semibold text-ink-700 hover:text-ink-900">Log in</Link>
            <Link to="/register" className="text-sm font-semibold bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
