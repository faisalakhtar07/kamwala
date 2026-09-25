import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, MapPin, Users, IndianRupee, Clock, CheckCircle2, Briefcase, LogOut } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States';
import { Button } from '../components/Form';
import { StatusPill, RequestIdTag } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { playNotificationSound } from '../utils/sound';
import { enablePushNotifications, getPushPermission, isPushSupported } from '../utils/push';
import {
  getMyWorkerProfile, setAvailability, getAvailableWork, acceptWork, getMyBookings, updateBookingStatus,
} from '../api/worker';

const AVAILABILITY_STYLE = {
  available: 'bg-mint-50 text-mint-600 border-mint-200',
  busy: 'bg-amber-50 text-amber-600 border-amber-200',
  offline: 'bg-cloud-100 text-ink-500 border-cloud-200',
};
const NEXT_STATUS = { assigned: 'worker_on_the_way', worker_on_the_way: 'in_progress', in_progress: 'completed' };
const NEXT_LABEL = { assigned: "I'm on the way", worker_on_the_way: 'Start work', in_progress: 'Mark completed' };
const TABS = [{ value: 'available', label: 'New Work' }, { value: 'active', label: 'My Bookings' }];

export default function WorkerDashboard() {
  const { logout } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('available');
  const [availableWork, setAvailableWork] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [prevWorkCount, setPrevWorkCount] = useState(null);
  const [pushPermission, setPushPermission] = useState(getPushPermission());

  const handleEnableNotifications = async () => {
    const ok = await enablePushNotifications();
    setPushPermission(getPushPermission());
    if (ok) push('Notifications enabled - new work will alert you even with the app closed.', 'success');
  };

  const load = (isPoll) => {
    if (!isPoll) setLoading(true);
    setError('');
    Promise.all([getMyWorkerProfile(), getAvailableWork(), getMyBookings()])
      .then(([p, work, myBookings]) => {
        setProfile(p);
        if (prevWorkCount !== null && work.length > prevWorkCount) {
          playNotificationSound();
        }
        setPrevWorkCount(work.length);
        setAvailableWork(work);
        setBookings(myBookings);
      })
      .catch((e) => !isPoll && setError(e.message))
      .finally(() => !isPoll && setLoading(false));
  };

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cycleAvailability = async () => {
    if (!profile) return;
    const order = ['available', 'busy', 'offline'];
    const next = order[(order.indexOf(profile.availability) + 1) % order.length];
    setTogglingAvailability(true);
    try {
      const updated = await setAvailability(next);
      setProfile(updated);
      push(`You're now ${next}.`, 'success');
    } catch (err) {
      push(err.message || 'Could not update availability.', 'error');
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleAccept = async (requestId) => {
    setAcceptingId(requestId);
    try {
      await acceptWork(requestId);
      push('Work accepted! Check "My Bookings".', 'success');
      load(false);
      setTab('active');
    } catch (err) {
      push(err.message || 'Someone else may have already accepted this.', 'error');
      load(false);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAdvanceStatus = async (booking) => {
    const next = NEXT_STATUS[booking.status];
    if (!next) return;
    try {
      await updateBookingStatus(booking.requestId, next);
      push('Status updated.', 'success');
      load(false);
    } catch (err) {
      push(err.message || 'Could not update status.', 'error');
    }
  };

  if (loading) return <AppLayout title="Worker Dashboard"><CardSkeleton count={3} /></AppLayout>;
  if (error) return <AppLayout title="Worker Dashboard"><ErrorState message={error} onRetry={() => load(false)} /></AppLayout>;

  return (
    <AppLayout title="Worker Dashboard">
      <div className="bg-white border border-cloud-200 rounded-card p-5 shadow-soft mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-display font-bold text-lg">{profile?.name}</p>
            <p className="text-sm text-ink-500">{(profile?.categories || []).join(', ')}</p>
            <p className="text-xs text-ink-500 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {profile?.primaryPincode}
              {profile?.servicePincodes?.length > 0 && ` +${profile.servicePincodes.length} more`}
            </p>
          </div>
          <button onClick={cycleAvailability} disabled={togglingAvailability}
            className={`text-sm font-semibold px-4 py-2 rounded-pill border transition-colors ${AVAILABILITY_STYLE[profile?.availability] || AVAILABILITY_STYLE.offline}`}>
            {togglingAvailability ? 'Updating…' : `● ${profile?.availability}`}
          </button>
        </div>
        {isPushSupported() && pushPermission !== 'granted' && (
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-pill px-3 py-1.5 hover:bg-brand-100 transition-colors w-fit"
          >
            <BellRing size={14} />
            {pushPermission === 'denied' ? 'Notifications blocked — check browser settings' : 'Enable notifications for new work'}
          </button>
        )}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-cloud-50 rounded-lg p-3 text-center">
            <p className="font-display font-bold text-lg">{profile?.completedJobs ?? 0}</p>
            <p className="text-xs text-ink-500">Completed</p>
          </div>
          <div className="bg-cloud-50 rounded-lg p-3 text-center">
            <p className="font-display font-bold text-lg">{profile?.rating?.average?.toFixed(1) || 'New'}</p>
            <p className="text-xs text-ink-500">Rating</p>
          </div>
          <div className="bg-cloud-50 rounded-lg p-3 text-center">
            <p className="font-display font-bold text-lg">{profile?.experienceYears ?? 0}y</p>
            <p className="text-xs text-ink-500">Experience</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${tab === t.value ? 'bg-brand-500 text-white' : 'bg-white border border-cloud-200 text-ink-700 hover:bg-cloud-50'}`}>
            {t.label}
            {t.value === 'available' && availableWork.length > 0 && (
              <span className="ml-1.5 bg-white/25 rounded-pill px-1.5">{availableWork.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'available' && (
        <>
          {availableWork.length === 0 && (
            <EmptyState icon={Bell} title="No matching work right now" description="New requests in your category and pincode area will show up here." />
          )}
          <div className="space-y-3">
            {availableWork.map((w) => (
              <div key={w._id} className="bg-white border border-cloud-200 rounded-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <RequestIdTag id={w.requestId} size="sm" />
                    <p className="font-display font-semibold text-sm mt-1.5">{w.service}</p>
                    <p className="text-xs text-ink-500">{w.serviceCategory}</p>
                  </div>
                  {w.workerCount > 1 && <span className="flex items-center gap-1 text-xs text-ink-500"><Users size={12} /> {w.workerCount}</span>}
                </div>
                {w.description && <p className="text-sm text-ink-700 mt-2 bg-cloud-50 rounded-lg p-2.5">{w.description}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-ink-500">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {w.address?.city} - {w.address?.pincode}</span>
                  {w.preferredTime && <span className="flex items-center gap-1"><Clock size={12} /> {w.preferredTime}</span>}
                  {(w.budget || w.estimatedPrice) && <span className="flex items-center gap-1"><IndianRupee size={12} /> {w.estimatedPrice || w.budget}</span>}
                </div>
                <Button size="sm" className="w-full mt-3" onClick={() => handleAccept(w.requestId)} disabled={acceptingId === w.requestId}>
                  {acceptingId === w.requestId ? 'Accepting…' : 'Accept Work'}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'active' && (
        <>
          {bookings.length === 0 && <EmptyState icon={Briefcase} title="No bookings yet" description="Accepted work will show up here." />}
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white border border-cloud-200 rounded-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <RequestIdTag id={b.requestId} size="sm" />
                    <p className="font-display font-semibold text-sm mt-1.5">{b.service}</p>
                    <p className="text-xs text-ink-500">{b.customerId?.name} · {b.address?.city}</p>
                  </div>
                  <StatusPill status={b.status} />
                </div>
                {NEXT_STATUS[b.status] && (
                  <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => handleAdvanceStatus(b)}>
                    <CheckCircle2 size={14} /> {NEXT_LABEL[b.status]}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-rose-500 mt-8 mx-auto">
        <LogOut size={15} /> Log out
      </button>
    </AppLayout>
  );
}
