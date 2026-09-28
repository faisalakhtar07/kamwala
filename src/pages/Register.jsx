import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, User, Wrench, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, Textarea } from '../components/Form';
import { getCategories } from '../api/misc';

export default function Register() {
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType = searchParams.get('type') === 'worker' ? 'worker' : null;
  const { t } = useLanguage();
  const [userType, setUserType] = useState(initialType);
  const [categories, setCategories] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', mobile: '', password: '', confirmPassword: '', email: '',
    pincode: '', category: '', services: '', experienceYears: '',
    address: '', city: '', primaryPincode: '', servicePincodes: '',
    referralCode: '',
  });

  useEffect(() => {
    if (userType === 'worker' && categories.length === 0) {
      getCategories().then(setCategories).catch(() => setCategories([]));
    }
  }, [userType, categories.length]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const updatePincode = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value.replace(/\D/g, '').slice(0, 6) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || form.name.trim().length < 2) return setError('Please enter your full name.');
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError('Enter a valid 10-digit mobile number.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (userType === 'worker' && !form.category) return setError('Please select your work category.');
    if (userType === 'worker' && !/^\d{6}$/.test(form.primaryPincode))
      return setError('Enter a valid 6-digit primary service pincode.');
    if (userType === 'customer' && form.pincode && !/^\d{6}$/.test(form.pincode))
      return setError('Enter a valid 6-digit pincode.');

    setLoading(true);
    try {
      const payload = {
        userType,
        name: form.name.trim(),
        mobile: form.mobile,
        password: form.password,
        confirmPassword: form.confirmPassword,
        email: form.email || undefined,
        referralCode: form.referralCode.trim() || undefined,
      };
      if (userType === 'worker') {
        payload.categories = [form.category];
        payload.services = form.services ? form.services.split(',').map((s) => s.trim()).filter(Boolean) : [];
        payload.experienceYears = form.experienceYears;
        payload.address = form.address;
        payload.city = form.city;
        payload.primaryPincode = form.primaryPincode;
        payload.servicePincodes = form.servicePincodes
          ? form.servicePincodes.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
      } else {
        payload.pincode = form.pincode || undefined;
      }

      await register(payload);
      push(
        userType === 'worker' ? 'Welcome to KamWala! Your worker dashboard is ready.' : 'Account created successfully!',
        'success'
      );
      navigate(userType === 'worker' ? '/worker' : '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-cloud-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-2"><LanguageToggle /></div>
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-brand-500 text-white flex items-center justify-center font-display font-bold text-xl mb-4">K</div>
            <h1 className="font-display font-bold text-xl">{t('reg.whatToDo')}</h1>
            <p className="text-sm text-ink-500 mt-1">{t('reg.choose')}</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => setUserType('customer')} className="w-full flex items-center gap-4 bg-white border border-cloud-200 rounded-card p-5 shadow-soft hover:border-brand-300 hover:bg-cloud-50 transition-colors text-left">
              <span className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><User size={22} /></span>
              <div>
                <p className="font-display font-semibold">{t('reg.bookService')}</p>
                <p className="text-sm text-ink-500">{t('reg.bookServiceDesc')}</p>
              </div>
            </button>
            <button onClick={() => setUserType('worker')} className="w-full flex items-center gap-4 bg-white border border-cloud-200 rounded-card p-5 shadow-soft hover:border-brand-300 hover:bg-cloud-50 transition-colors text-left">
              <span className="h-12 w-12 rounded-full bg-mint-50 text-mint-600 flex items-center justify-center shrink-0"><Wrench size={22} /></span>
              <div>
                <p className="font-display font-semibold">{t('reg.becomeWorker')}</p>
                <p className="text-sm text-ink-500">{t('reg.becomeWorkerDesc')}</p>
              </div>
            </button>
          </div>
          <p className="text-center text-sm text-ink-500 mt-6">
            {t('auth.alreadyHave')} <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cloud-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-2"><LanguageToggle /></div>
        <button onClick={() => setUserType(null)} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-4">
          <ArrowLeft size={15} /> {t('common.back')}
        </button>
        <div className="mb-6">
          <h1 className="font-display font-bold text-xl">{userType === 'worker' ? t('reg.becomeWorker') : t('reg.createYourAccount')}</h1>
          <p className="text-sm text-ink-500 mt-1">
            {userType === 'worker' ? t('reg.workerDesc') : t('reg.customerDesc')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-cloud-200 rounded-card p-6 shadow-soft space-y-4">
          <Input label={t('auth.fullName')} value={form.name} onChange={update('name')} />
          <Input label={t('auth.mobile')} type="tel" inputMode="numeric" maxLength={10} value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))} />
          <Input label={t('auth.email')} type="email" value={form.email} onChange={update('email')} />
          <Input label={t('auth.referral')} value={form.referralCode} onChange={update('referralCode')} placeholder={t('auth.referralPlaceholder')} />
          <div className="relative">
            <Input label={t('auth.password')} type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-[38px] text-ink-500 hover:text-ink-900" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <Input label={t('auth.confirmPassword')} type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={update('confirmPassword')} />

          {userType === 'worker' ? (
            <>
              <label className="block">
                <span className="block text-sm font-medium text-ink-700 mb-1.5">{t('reg.workCategory')}</span>
                <select value={form.category} onChange={update('category')} className="w-full rounded-lg border border-cloud-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors">
                  <option value="">{t('reg.selectCategory')}</option>
                  {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </label>
              <Input label={t('reg.skills')} placeholder="Wiring, Fan installation" value={form.services} onChange={update('services')} />
              <Input label={t('reg.experience')} type="number" min="0" value={form.experienceYears} onChange={update('experienceYears')} />
              <Textarea label={t('reg.address')} rows={2} value={form.address} onChange={update('address')} />
              <Input label={t('reg.city')} value={form.city} onChange={update('city')} />
              <Input label={t('reg.primaryPincode')} inputMode="numeric" placeholder="e.g. 824101" value={form.primaryPincode} onChange={updatePincode('primaryPincode')} />
              <Input label={t('reg.extraPincodes')} placeholder="824102, 824103" value={form.servicePincodes} onChange={update('servicePincodes')} />
            </>
          ) : (
            <Input label={t('reg.pincodeOpt')} inputMode="numeric" placeholder="e.g. 824101" value={form.pincode} onChange={updatePincode('pincode')} />
          )}

          {error && <p className="text-sm text-rose-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('reg.creating') : userType === 'worker' ? t('reg.createWorker') : t('reg.create')}
          </Button>
          <p className="text-center text-sm text-ink-500">
            {t('auth.alreadyHave')} <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">{t('auth.signIn')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
