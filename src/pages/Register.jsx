import { useEffect, useState } from 'react';
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
  const [userType, setUserType] = useState(initialType);
  const [categories, setCategories] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    email: '',
    category: '',
    services: '',
    experienceYears: '',
    address: '',
    city: '',
  });

  useEffect(() => {
    if (userType === 'worker' && categories.length === 0) {
      getCategories().then(setCategories).catch(() => setCategories([]));
    }
  }, [userType, categories.length]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || form.name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (userType === 'worker' && !form.category) {
      setError('Please select your work category.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userType,
        name: form.name.trim(),
        mobile: form.mobile,
        password: form.password,
        confirmPassword: form.confirmPassword,
        email: form.email || undefined,
      };
      if (userType === 'worker') {
        payload.categories = [form.category];
        payload.services = form.services
          ? form.services.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        payload.experienceYears = form.experienceYears;
        payload.address = form.address;
        payload.city = form.city;
      }

      const data = await register(payload);
      push(
        userType === 'worker'
          ? 'Account created! Your worker application has been submitted.'
          : 'Account created successfully!',
        'success'
      );
      navigate(userType === 'worker' ? '/dashboard' : '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: choose what they want to do
  if (!userType) {
    return (
      <div className="min-h-screen bg-cloud-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-brand-500 text-white flex items-center justify-center font-display font-bold text-xl mb-4">
              K
            </div>
            <h1 className="font-display font-bold text-xl">What do you want to do?</h1>
            <p className="text-sm text-ink-500 mt-1">Choose how you'd like to use KamWala.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setUserType('customer')}
              className="w-full flex items-center gap-4 bg-white border border-cloud-200 rounded-card p-5 shadow-soft hover:border-brand-300 hover:bg-cloud-50 transition-colors text-left"
            >
              <span className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <User size={22} />
              </span>
              <div>
                <p className="font-display font-semibold">Book a Service</p>
                <p className="text-sm text-ink-500">Find trusted workers for your work.</p>
              </div>
            </button>

            <button
              onClick={() => setUserType('worker')}
              className="w-full flex items-center gap-4 bg-white border border-cloud-200 rounded-card p-5 shadow-soft hover:border-brand-300 hover:bg-cloud-50 transition-colors text-left"
            >
              <span className="h-12 w-12 rounded-full bg-mint-50 text-mint-600 flex items-center justify-center shrink-0">
                <Wrench size={22} />
              </span>
              <div>
                <p className="font-display font-semibold">Become a Worker</p>
                <p className="text-sm text-ink-500">Join KamWala and get connected to customers.</p>
              </div>
            </button>
          </div>

          <p className="text-center text-sm text-ink-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: the actual form
  return (
    <div className="min-h-screen bg-cloud-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <button
          onClick={() => setUserType(null)}
          className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-4"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="mb-6">
          <h1 className="font-display font-bold text-xl">
            {userType === 'worker' ? 'Become a Worker' : 'Create your account'}
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {userType === 'worker'
              ? 'Tell us about yourself — KamWala will review your application.'
              : 'Book trusted workers for any work, managed end to end.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-cloud-200 rounded-card p-6 shadow-soft space-y-4">
          <Input label="Full name" value={form.name} onChange={update('name')} />
          <Input
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))}
          />
          <Input label="Email (optional)" type="email" value={form.email} onChange={update('email')} />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
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

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
          />

          {userType === 'worker' && (
            <>
              <label className="block">
                <span className="block text-sm font-medium text-ink-700 mb-1.5">Work category</span>
                <select
                  value={form.category}
                  onChange={update('category')}
                  className="w-full rounded-lg border border-cloud-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Skills / services (comma separated)"
                placeholder="Wiring, Fan installation"
                value={form.services}
                onChange={update('services')}
              />
              <Input
                label="Experience (years)"
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={update('experienceYears')}
              />
              <Textarea label="Address" rows={2} value={form.address} onChange={update('address')} />
              <Input label="City" value={form.city} onChange={update('city')} />
            </>
          )}

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : userType === 'worker' ? 'Submit application' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
