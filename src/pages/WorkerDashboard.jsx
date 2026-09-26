import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, MapPin, Users, IndianRupee, Clock, CheckCircle2, Briefcase, LogOut, ShieldCheck } from 'lucide-react';
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
  requestCompletionOtp, createCommissionOrder, verifyCommissionPayment,
} from '../api/worker';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const AVAILABILITY_STYLE = {
  available: 'bg-mint-50 text-mint-600 border-mint-200',
  busy: 'bg-amber-50 text-amber-600 border-amber-200',
  offline: 'bg-cloud-100 text-ink-500 border-cloud-200',
};
// 'worker_on_the_way' and 'in_progress' are handled with dedicated OTP UI
// below instead of a plain one-tap button - only 'assigned' -> "on the
// way" needs no verification.
const NEXT_STATUS = { assigned: 'worker_on_the_way' };
const NEXT_LABEL = { assigned: "I'm on the way" };
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
  const [otpInputs, setOtpInputs] = useState({}); // { [requestId]: '1234' }
  const [submittingId, setSubmittingId] = useState(null); // requestId currently mid-action
  const [payingId, setPayingId] = useState(null);

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

  // Worker has arrived and asks the customer for the start OTP - this is
  // what actually moves the job from "on the way" to "in progress".
  const handleVerifyStartOtp = async (booking) => {
    const otp = (otpInputs[booking.requestId] || '').trim();
    if (!otp) return push('Enter the OTP the customer gave you.', 'error');
    setSubmittingId(booking.requestId);
    try {
      await updateBookingStatus(booking.requestId, 'in_progress', otp);
      push('Work started!', 'success');
      setOtpInputs((prev) => ({ ...prev, [booking.requestId]: '' }));
      load(false);
    } catch (err) {
      push(err.message || 'Incorrect OTP.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  // Worker taps this once the physical work is actually finished - it
  // sends a fresh completion OTP to the customer, it does NOT complete
  // the job yet.
  const handleRequestCompletionOtp = async (booking) => {
    setSubmittingId(booking.requestId);
    try {
      await requestCompletionOtp(booking.requestId);
      push('OTP sent to the customer - ask them for it to confirm completion.', 'success');
      load(false);
    } catch (err) {
      push(err.message || 'Could not request completion OTP.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  // Customer reads out the completion OTP - entering it here is what
  // actually marks the job completed and frees up the worker.
  const handleVerifyCompletionOtp = async (booking) => {
    const otp = (otpInputs[booking.requestId] || '').trim();
    if (!otp) return push('Enter the OTP the customer gave you.', 'error');
    setSubmittingId(booking.requestId);
    try {
      await updateBookingStatus(booking.requestId, 'completed', otp);
      push('Job marked complete!', 'success');
      setOtpInputs((prev) => ({ ...prev, [booking.requestId]: '' }));
      load(false);
    } catch (err) {
      push(err.message || 'Incorrect OTP.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  // Worker pays their owed platform commission via Razorpay, same pattern
  // as the customer's service payment flow elsewhere in the app.
  const handlePayCommission = async (booking) => {
    setPayingId(booking.requestId);
    try {
      const order = await createCommissionOrder(booking.requestId);
      if (typeof window.Razorpay !== 'function') {
        await loadRazorpayScript();
      }
      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: 'KamWala',
        description: `Commission for ${booking.requestId}`,
        theme: { color: '#D97757' },
        handler: async (response) => {
          try {
            await verifyCommissionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            push('Commission paid. Thank you!', 'success');
            load(false);
          } catch (err) {
            push(err.message || 'Payment verification failed.', 'error');
          }
        },
      });
      rzp.open();
    } catch (err) {
      push(err.message || 'Could not start payment.', 'error');
    } finally {
      setPayingId(null);
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
            {bookings.map((b) => {
              const isBusy = submittingId === b.requestId;
              const completionRequested = !!b.completionOtp?.generatedAt && !b.completionOtp?.verifiedAt;

              return (
                <div key={b._id} className="bg-white border border-cloud-200 rounded-card p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <RequestIdTag id={b.requestId} size="sm" />
                      <p className="font-display font-semibold text-sm mt-1.5">{b.service}</p>
                      <p className="text-xs text-ink-500">{b.customerId?.name} · {b.address?.city}</p>
                    </div>
                    <StatusPill status={b.status} />
                  </div>

                  {/* assigned -> on the way: no OTP needed */}
                  {b.status === 'assigned' && (
                    <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => handleAdvanceStatus(b)}>
                      <CheckCircle2 size={14} /> {NEXT_LABEL.assigned}
                    </Button>
                  )}

                  {/* on the way -> in progress: ask customer for start OTP */}
                  {b.status === 'worker_on_the_way' && (
                    <div className="mt-3 bg-cloud-50 rounded-lg p-3">
                      <p className="text-xs text-ink-700 flex items-center gap-1.5 mb-2">
                        <ShieldCheck size={13} className="text-brand-500" />
                        Ask the customer for their start OTP to begin work
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={otpInputs[b.requestId] || ''}
                          onChange={(e) => setOtpInputs((prev) => ({ ...prev, [b.requestId]: e.target.value }))}
                          placeholder="Enter OTP"
                          inputMode="numeric"
                          maxLength={4}
                          className="flex-1 min-w-0 border border-cloud-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
                        />
                        <Button size="sm" onClick={() => handleVerifyStartOtp(b)} disabled={isBusy}>
                          {isBusy ? 'Checking…' : 'Confirm'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* in progress: either request the completion OTP, or (once
                      requested) enter it to actually mark the job complete */}
                  {b.status === 'in_progress' && !completionRequested && (
                    <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => handleRequestCompletionOtp(b)} disabled={isBusy}>
                      <CheckCircle2 size={14} /> {isBusy ? 'Sending…' : 'Mark job as done'}
                    </Button>
                  )}
                  {b.status === 'in_progress' && completionRequested && (
                    <div className="mt-3 bg-cloud-50 rounded-lg p-3">
                      <p className="text-xs text-ink-700 flex items-center gap-1.5 mb-2">
                        <ShieldCheck size={13} className="text-brand-500" />
                        Ask the customer for their completion OTP to finish
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={otpInputs[b.requestId] || ''}
                          onChange={(e) => setOtpInputs((prev) => ({ ...prev, [b.requestId]: e.target.value }))}
                          placeholder="Enter OTP"
                          inputMode="numeric"
                          maxLength={4}
                          className="flex-1 min-w-0 border border-cloud-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
                        />
                        <Button size="sm" onClick={() => handleVerifyCompletionOtp(b)} disabled={isBusy}>
                          {isBusy ? 'Checking…' : 'Confirm'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* completed: show commission owed (if any) and let the
                      worker pay it right from here */}
                  {b.status === 'completed' && b.commissionStatus === 'pending' && b.commissionAmount > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-amber-700">
                        Commission due: <span className="font-semibold">₹{b.commissionAmount}</span> ({b.commissionPercent}%)
                      </p>
                      <Button size="sm" onClick={() => handlePayCommission(b)} disabled={payingId === b.requestId}>
                        <IndianRupee size={14} /> {payingId === b.requestId ? 'Opening…' : 'Pay Now'}
                      </Button>
                    </div>
                  )}
                  {b.status === 'completed' && b.commissionStatus === 'paid' && (
                    <p className="mt-3 text-xs text-mint-600 flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Commission paid
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-rose-500 mt-8 mx-auto">
        <LogOut size={15} /> Log out
      </button>
    </AppLayout>
  );
}
