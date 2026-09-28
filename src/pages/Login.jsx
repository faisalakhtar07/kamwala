import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input } from '../components/Form';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

export default function Login() {
  const { login } = useAuth();
  const { push } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(mobile, password);
      push('Welcome back!', 'success');
      navigate(data.user.role === 'worker' ? '/worker' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cloud-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-2"><LanguageToggle /></div>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand-500 text-white flex items-center justify-center font-display font-bold text-xl mb-4">
            K
          </div>
          <h1 className="font-display font-bold text-xl">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-ink-500 mt-1">{t('auth.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-cloud-200 rounded-card p-6 shadow-soft space-y-4">
          <Input
            label={t('auth.mobile')}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="98765 43210"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />

          <div className="relative">
            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-[38px] text-ink-500 hover:text-ink-900"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>

          <p className="text-center text-sm text-ink-500">
            {t('auth.newToKamwala')}{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              {t('auth.createAccount')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
