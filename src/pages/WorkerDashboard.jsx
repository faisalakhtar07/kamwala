import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, MapPin, Users, IndianRupee, Clock, CheckCircle2, Briefcase, LogOut, ShieldCheck, AlertTriangle, Trophy, Wallet } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States';
import { Button } from '../components/Form';
import { StatusPill, RequestIdTag } from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { useToast } from '../context/ToastContext';
import { playNotificationSound } from '../utils/sound';
import { enablePushNotifications, getPushPermission, isPushSupported } from '../utils/push';
import {
  getMyWorkerProfile, setAvailability, getAvailableWork, acceptWork, getMyBookings, updateBookingStatus,
  requestCompletionOtp, createCommissionOrder, verifyCommissionPayment, raiseDispute, getMyEarnings, getLeaderboard,
  updateMyServicePricing,
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
const TABS = [
  { value: 'available', label: 'worker.tab.newWork' },
  { value: 'active', label: 'worker.tab.myBookings' },
  { value: 'services', label: 'worker.tab.myPricing' },
  { value: 'earnings', label: 'worker.tab.earnings' },
];

export default function WorkerDashboard() {
  const { logout } = useAuth();
  const { push } = useToast();
  const { t } = useLanguage();
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
  const [earnings, setEarnings] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [disputeFormId, setDisputeFormId] = useState(null); // requestId with dispute form open
  const [disputeReasons, setDisputeReasons] = useState({}); // { [requestId]: 'text' }
  const [submittingDisputeId, setSubmittingDisputeId] = useState(null);
  const [servicePricingRows, setServicePricingRows] = useState([]);
  const [savingPricing, setSavingPricing] = useState(false);

  const handleEnableNotifications = async () => {
    const ok = await enablePushNotifications();
    setPushPermission(getPushPermission());
    if (ok) push('Notifications enabled - new work will alert you even with the app closed.', 'success');
  };

  const load = (isPoll) => {
    if (!isPoll) setLoading(true);
    setError('');
    const calls = [getMyWorkerProfile(), getAvailableWork(), getMyBookings()];
    Promise.all(calls)
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

    // Earnings/leaderboard don't need the 20s poll cadence - only refresh
    // them on a real (non-poll) load, e.g. first mount or after an action.
    if (!isPoll) {
      getMyEarnings().then(setEarnings).catch(() => {});
      getLeaderboard().then(setLeaderboard).catch(() => {});
    }
  };

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed the editable pricing rows from the worker's saved profile, once,
  // the first time it loads - don't clobber their in-progress edits on
  // later polls.
  useEffect(() => {
    if (profile && servicePricingRows.length === 0 && profile.servicePricing?.length > 0) {
      setServicePricingRows(profile.servicePricing.map((s) => ({ name: s.name, price: String(s.price) })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleAddPricingRow = () => setServicePricingRows((rows) => [...rows, { name: '', price: '' }]);
  const handleRemovePricingRow = (i) => setServicePricingRows((rows) => rows.filter((_, idx) => idx !== i));
  const handlePricingRowChange = (i, field, value) =>
    setServicePricingRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const handleSaveServicePricing = async () => {
    const cleaned = servicePricingRows
      .map((r) => ({ name: r.name.trim(), price: Number(r.price) }))
      .filter((r) => r.name && !Number.isNaN(r.price) && r.price >= 0);
    if (cleaned.length === 0) return push('Add at least one service with a valid price.', 'error');

    setSavingPricing(true);
    try {
      const updated = await updateMyServicePricing(cleaned);
      setProfile(updated);
      push('Pricing saved.', 'success');
    } catch (err) {
      push(err.message || 'Could not save pricing.', 'error');
    } finally {
      setSavingPricing(false);
    }
  };

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

  const handleRaiseDispute = async (booking) => {
    const reason = (disputeReasons[booking.requestId] || '').trim();
    if (!reason) return push('Please describe the issue.', 'error');
    setSubmittingDisputeId(booking.requestId);
    try {
      await raiseDispute(booking.requestId, reason);
      push('Issue reported. Our team will review it shortly.', 'success');
      setDisputeFormId(null);
      setDisputeReasons((prev) => ({ ...prev, [booking.requestId]: '' }));
      load(false);
    } catch (err) {
      push(err.message || 'Could not report the issue.', 'error');
    } finally {
      setSubmittingDisputeId(null);
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
      if (order.paidFromWallet) {
        push('Commission paid from your wallet balance.', 'success');
        load(false);
        return;
      }
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

  if (loading) return <AppLayout title={t('worker.title')}><CardSkeleton count={3} /></AppLayout>;
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
            {pushPermission === 'denied' ? 'Notifications blocked — check browser settings' : t('worker.enableNotifications')}
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
        {TABS.map((tabItem) => (
          <button key={tabItem.value} onClick={() => setTab(tabItem.value)}
            className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${tab === tabItem.value ? 'bg-brand-500 text-white' : 'bg-white border border-cloud-200 text-ink-700 hover:bg-cloud-50'}`}>
            {t(tabItem.label)}
            {tabItem.value === 'available' && availableWork.length > 0 && (
              <span className="ml-1.5 bg-white/25 rounded-pill px-1.5">{availableWork.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'available' && (
        <>
          {earnings?.totalCommissionPending > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">₹{earnings.totalCommissionPending} {t('worker.commissionPending')}</span>
              </p>
              <Button size="sm" onClick={() => setTab('earnings')}>View & Pay</Button>
            </div>
          )}
          {availableWork.length === 0 && (
            <EmptyState icon={Bell} title={t('worker.noWork')} description={t('worker.noWorkDesc')} />
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
                  {acceptingId === w.requestId ? t('common.saving') : t('worker.accept')}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'active' && (
        <>
          {bookings.length === 0 && <EmptyState icon={Briefcase} title={t('worker.noBookings')} description={t('worker.noBookingsDesc')} />}
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
                      <CheckCircle2 size={14} /> {t('worker.onTheWay')}
                    </Button>
                  )}

                  {/* on the way -> in progress: ask customer for start OTP */}
                  {b.status === 'worker_on_the_way' && (
                    <div className="mt-3 bg-cloud-50 rounded-lg p-3">
                      <p className="text-xs text-ink-700 flex items-center gap-1.5 mb-2">
                        <ShieldCheck size={13} className="text-brand-500" />
                        {t('worker.askStartOtp')}
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={otpInputs[b.requestId] || ''}
                          onChange={(e) => setOtpInputs((prev) => ({ ...prev, [b.requestId]: e.target.value }))}
                          placeholder={t('worker.enterOtp')}
                          inputMode="numeric"
                          maxLength={4}
                          className="flex-1 min-w-0 border border-cloud-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
                        />
                        <Button size="sm" onClick={() => handleVerifyStartOtp(b)} disabled={isBusy}>
                          {isBusy ? t('common.checking') : t('common.confirm')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* in progress: either request the completion OTP, or (once
                      requested) enter it to actually mark the job complete */}
                  {b.status === 'in_progress' && !completionRequested && (
                    <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => handleRequestCompletionOtp(b)} disabled={isBusy}>
                      <CheckCircle2 size={14} /> {isBusy ? t('common.saving') : t('worker.markDone')}
                    </Button>
                  )}
                  {b.status === 'in_progress' && completionRequested && (
                    <div className="mt-3 bg-cloud-50 rounded-lg p-3">
                      <p className="text-xs text-ink-700 flex items-center gap-1.5 mb-2">
                        <ShieldCheck size={13} className="text-brand-500" />
                        {t('worker.askCompletionOtp')}
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={otpInputs[b.requestId] || ''}
                          onChange={(e) => setOtpInputs((prev) => ({ ...prev, [b.requestId]: e.target.value }))}
                          placeholder={t('worker.enterOtp')}
                          inputMode="numeric"
                          maxLength={4}
                          className="flex-1 min-w-0 border border-cloud-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
                        />
                        <Button size="sm" onClick={() => handleVerifyCompletionOtp(b)} disabled={isBusy}>
                          {isBusy ? t('common.checking') : t('common.confirm')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* completed: show commission owed (if any) and let the
                      worker pay it right from here */}
                  {b.status === 'completed' && b.commissionStatus === 'pending' && b.commissionAmount > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-amber-700">
                        {t('worker.commissionDue')}: <span className="font-semibold">₹{b.commissionAmount}</span> ({b.commissionPercent}%)
                      </p>
                      <Button size="sm" onClick={() => handlePayCommission(b)} disabled={payingId === b.requestId}>
                        <IndianRupee size={14} /> {payingId === b.requestId ? t('common.saving') : t('worker.payNow')}
                      </Button>
                    </div>
                  )}
                  {b.status === 'completed' && b.commissionStatus === 'paid' && (
                    <p className="mt-3 text-xs text-mint-600 flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> {t('worker.commissionPaid')}
                    </p>
                  )}

                  {/* dispute: available any time the job isn't already
                      finished/cancelled/disputed */}
                  {!['completed', 'cancelled', 'disputed'].includes(b.status) && disputeFormId !== b.requestId && (
                    <button
                      type="button"
                      onClick={() => setDisputeFormId(b.requestId)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-amber-600"
                    >
                      <AlertTriangle size={13} /> {t('worker.reportIssue')}
                    </button>
                  )}
                  {disputeFormId === b.requestId && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <textarea
                        rows={2}
                        placeholder={t('worker.whatWentWrong')}
                        value={disputeReasons[b.requestId] || ''}
                        onChange={(e) => setDisputeReasons((prev) => ({ ...prev, [b.requestId]: e.target.value }))}
                        className="w-full border border-cloud-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400 resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => handleRaiseDispute(b)} disabled={submittingDisputeId === b.requestId}>
                          {submittingDisputeId === b.requestId ? t('common.saving') : t('worker.submitReport')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDisputeFormId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {b.status === 'disputed' && (
                    <p className="mt-3 text-xs text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle size={13} /> {t('worker.underReview')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'services' && (
        <>
          <p className="text-xs text-ink-500 mb-3">
            {t('worker.pricingHelp')}
          </p>
          <div className="space-y-2 mb-3">
            {servicePricingRows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={row.name}
                  onChange={(e) => handlePricingRowChange(i, 'name', e.target.value)}
                  placeholder={t('worker.serviceName')}
                  className="flex-1 min-w-0 border border-cloud-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={row.price}
                    onChange={(e) => handlePricingRowChange(i, 'price', e.target.value)}
                    placeholder={t('worker.price')}
                    className="w-full border border-cloud-200 rounded-lg pl-6 pr-2 py-2 text-sm outline-none focus:border-brand-400"
                  />
                </div>
                <button type="button" onClick={() => handleRemovePricingRow(i)} className="text-ink-500 hover:text-rose-500 text-xs px-1">
                  {t('common.remove')}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleAddPricingRow}>{t('worker.addService')}</Button>
            <Button size="sm" onClick={handleSaveServicePricing} disabled={savingPricing}>
              {savingPricing ? t('common.saving') : t('worker.savePricing')}
            </Button>
          </div>
        </>
      )}

      {tab === 'earnings' && (
        <>
          {profile?.referralCode && (
            <div className="bg-brand-50 border border-brand-200 rounded-card p-4 mb-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-ink-500">{t('worker.referralCode')}</p>
                  <p className="font-display font-bold text-lg tracking-wider">{profile.referralCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-500">{t('worker.walletBalance')}</p>
                  <p className="font-display font-bold text-lg">₹{profile.walletBalance ?? 0}</p>
                </div>
              </div>
              <p className="text-xs text-ink-500 mt-2">
                Share your code - you and your friend both get wallet credit when they sign up. Wallet balance is auto-used to pay your commission.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  navigator.clipboard?.writeText(profile.referralCode);
                  push('Referral code copied!', 'success');
                }}
              >
                {t('common.copy')}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white border border-cloud-200 rounded-card p-4 shadow-soft">
              <p className="text-xs text-ink-500 flex items-center gap-1.5"><Wallet size={13} /> {t('worker.totalEarned')}</p>
              <p className="font-display font-bold text-xl mt-1">₹{earnings?.totalEarned ?? 0}</p>
              <p className="text-xs text-ink-500 mt-0.5">{earnings?.totalJobsCompleted ?? 0} {t('worker.jobsCompleted')}</p>
            </div>
            <div className="bg-white border border-cloud-200 rounded-card p-4 shadow-soft">
              <p className="text-xs text-ink-500 flex items-center gap-1.5"><Wallet size={13} /> {t('worker.thisMonth')}</p>
              <p className="font-display font-bold text-xl mt-1">₹{earnings?.thisMonthEarned ?? 0}</p>
              <p className="text-xs text-ink-500 mt-0.5">{earnings?.thisMonthJobsCompleted ?? 0} jobs this month</p>
            </div>
          </div>

          {earnings?.totalCommissionPending > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-700 font-semibold">₹{earnings.totalCommissionPending} {t('worker.commissionPending')}</p>
              <p className="text-xs text-amber-700 mt-0.5">Pay it from the job's card in "My Bookings" to keep receiving new work.</p>
            </div>
          )}

          <h2 className="font-display font-semibold text-sm mb-2">{t('worker.recentJobs')}</h2>
          {(!earnings?.recentJobs || earnings.recentJobs.length === 0) ? (
            <EmptyState icon={Wallet} title="No completed jobs yet" description="Your completed jobs and earnings will show up here." />
          ) : (
            <div className="space-y-2 mb-6">
              {earnings.recentJobs.map((j) => (
                <div key={j._id} className="bg-white border border-cloud-200 rounded-card p-3 flex items-center justify-between gap-3">
                  <div>
                    <RequestIdTag id={j.requestId} size="sm" />
                    <p className="text-xs text-ink-500 mt-1">{j.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{j.finalPrice || j.estimatedPrice || 0}</p>
                    {j.commissionAmount > 0 && (
                      <p className={`text-[11px] ${j.commissionStatus === 'paid' ? 'text-mint-600' : 'text-amber-600'}`}>
                        {j.commissionStatus === 'paid' ? t('worker.commissionPaid') : `₹${j.commissionAmount} due`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="font-display font-semibold text-sm mb-2 flex items-center gap-1.5">
            <Trophy size={15} className="text-amber-500" /> {t('worker.leaderboard')}
          </h2>
          {leaderboard.length === 0 ? (
            <EmptyState icon={Trophy} title="No leaderboard data yet" description="Complete jobs this month to appear here." />
          ) : (
            <div className="bg-white border border-cloud-200 rounded-card shadow-soft divide-y divide-cloud-100">
              {leaderboard.map((w, i) => (
                <div key={w.workerId} className="flex items-center gap-3 px-4 py-3">
                  <span className="font-display font-bold text-sm text-ink-500 w-5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-ink-500">{w.jobsThisMonth} jobs this month</p>
                  </div>
                  {w.badge && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-amber-50 text-amber-600 border border-amber-200">
                      {w.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-rose-500 mt-8 mx-auto">
        <LogOut size={15} /> {t('common.logout')}
      </button>
    </AppLayout>
  );
}
