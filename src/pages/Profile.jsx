import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, Plus, LifeBuoy } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { Button, Input } from '../components/Form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addAddress, updateMyProfile } from '../api/misc';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const [addingAddress, setAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ fullAddress: '', city: '', pincode: '' });
  const [savingAddress, setSavingAddress] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({ name, email });
      await refreshUser();
      push('Profile updated.', 'success');
    } catch (err) {
      push(err.message || 'Could not update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.fullAddress || !addressForm.city || !addressForm.pincode) {
      push('Fill in the full address, city and pincode.', 'error');
      return;
    }
    setSavingAddress(true);
    try {
      await addAddress(addressForm);
      await refreshUser();
      push('Address added.', 'success');
      setAddressForm({ fullAddress: '', city: '', pincode: '' });
      setAddingAddress(false);
    } catch (err) {
      push(err.message || 'Could not add address.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <AppLayout>
      <h1 className="font-display font-bold text-xl mb-5">My Profile</h1>

      <div className="bg-white border border-cloud-200 rounded-card p-5 shadow-soft mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-display font-bold">
            {(user?.name || 'U').charAt(0)}
          </div>
          <div>
            <p className="font-display font-semibold">{user?.name || 'Add your name'}</p>
            <p className="text-sm text-ink-500">+91 {user?.mobile}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </div>

      <div className="bg-white border border-cloud-200 rounded-card p-5 shadow-soft mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm">Saved addresses</h2>
          {!addingAddress && (
            <button onClick={() => setAddingAddress(true)} className="flex items-center gap-1 text-sm font-semibold text-brand-600">
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {(user?.addresses || []).length === 0 && !addingAddress && (
          <p className="text-sm text-ink-500">No saved addresses yet.</p>
        )}

        <div className="space-y-2">
          {(user?.addresses || []).map((a) => (
            <div key={a._id} className="flex items-start gap-2.5 bg-cloud-50 rounded-lg p-3 text-sm">
              <MapPin size={15} className="text-ink-500 mt-0.5 shrink-0" />
              <span>{a.fullAddress}, {a.city} - {a.pincode}</span>
            </div>
          ))}
        </div>

        {addingAddress && (
          <form onSubmit={handleAddAddress} className="space-y-2.5 mt-3">
            <Input
              placeholder="Full address"
              value={addressForm.fullAddress}
              onChange={(e) => setAddressForm((f) => ({ ...f, fullAddress: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                placeholder="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
              />
              <Input
                placeholder="Pincode"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm((f) => ({ ...f, pincode: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setAddingAddress(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={savingAddress}>
                {savingAddress ? 'Saving…' : 'Save address'}
              </Button>
            </div>
          </form>
        )}
      </div>

      <button className="w-full flex items-center gap-3 bg-white border border-cloud-200 rounded-card p-4 shadow-soft mb-4 hover:bg-cloud-50 transition-colors">
        <LifeBuoy size={17} className="text-ink-500" />
        <span className="text-sm font-medium">Help & Support</span>
      </button>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        <LogOut size={16} /> Log out
      </Button>
    </AppLayout>
  );
}
