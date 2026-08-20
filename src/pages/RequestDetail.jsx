import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Star,
  Repeat,
  XCircle,
  Send,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { ErrorState } from '../components/States';
import { StatusPill, RequestIdTag } from '../components/StatusPill';
import { Button, Textarea } from '../components/Form';
import { ChatBubble } from '../components/ChatBubble';
import {
  getRequestDetail,
  cancelRequest,
  repeatRequest,
  getChatMessages,
  sendChatToOwner,
  submitReview,
} from '../api/misc';
import { createPaymentOrder, verifyPayment } from '../api/payments';
import { useToast } from '../context/ToastContext';

const STATUS_FLOW = [
  'new',
  'under_review',
  'contacted',
  'worker_being_arranged',
  'price_pending',
  'awaiting_customer_confirmation',
  'assigned',
  'worker_on_the_way',
  'in_progress',
  'completed',
];

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function RequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const chatEndRef = useRef(null);

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [paying, setPaying] = useState(false);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([getRequestDetail(requestId), getChatMessages(requestId)])
      .then(([r, msgs]) => {
        setRequest(r);
        setMessages(msgs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [requestId]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelRequest(requestId, 'Cancelled by customer');
      push('Request cancelled.', 'success');
      load();
    } catch (err) {
      push(err.message || 'Could not cancel request.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleRepeat = async () => {
    setRepeating(true);
    try {
      const fresh = await repeatRequest(requestId);
      push('New request created from this booking.', 'success');
      navigate(`/requests/${fresh.requestId}`);
    } catch (err) {
      push(err.message || 'Could not repeat this booking.', 'error');
    } finally {
      setRepeating(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || sendingChat) return;
    setSendingChat(true);
    setChatInput('');
    try {
      const msg = await sendChatToOwner(requestId, text);
      setMessages((m) => [...m, msg]);
    } catch (err) {
      push(err.message || 'Message could not be sent.', 'error');
    } finally {
      setSendingChat(false);
    }
  };

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const order = await createPaymentOrder(requestId, request.finalPrice);
      if (typeof window.Razorpay !== 'function') {
        await loadRazorpayScript();
      }

      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: 'KamWala',
        description: `Payment for ${requestId}`,
        theme: { color: '#D97757' },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            push('Payment successful.', 'success');
            load();
          } catch (err) {
            push(err.message || 'Payment verification failed.', 'error');
          }
        },
      });
      rzp.open();
    } catch (err) {
      push(err.message || 'Could not start payment.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!rating) {
      push('Please select a star rating.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview({ requestId, rating, comment: reviewComment });
      push('Thank you for your feedback!', 'success');
      load();
    } catch (err) {
      push(err.message || 'Could not submit your review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (error) {
    return (
      <AppLayout>
        <ErrorState message={error} onRetry={load} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-4"
      >
        <ArrowLeft size={15} /> Back to my requests
      </button>

      {loading && <div className="h-72 rounded-card bg-cloud-100 animate-pulse" />}

      {!loading && request && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-card border border-cloud-200 p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <RequestIdTag id={request.requestId} />
                  <h1 className="font-display font-bold text-xl mt-2">{request.service}</h1>
                  <p className="text-sm text-ink-500">{request.serviceCategory}</p>
                </div>
                <StatusPill status={request.status} />
              </div>

              {request.description && (
                <p className="text-sm text-ink-700 mt-4 bg-cloud-50 rounded-lg p-3">{request.description}</p>
              )}

              <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                <div className="flex items-start gap-2 text-ink-700">
                  <MapPin size={16} className="text-ink-500 mt-0.5 shrink-0" />
                  <span>{request.address?.fullAddress}, {request.address?.city} - {request.address?.pincode}</span>
                </div>
                <div className="flex items-start gap-2 text-ink-700">
                  <Calendar size={16} className="text-ink-500 mt-0.5 shrink-0" />
                  <span>
                    {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString('en-IN') : 'Flexible'}
                    {request.preferredTime ? ` · ${request.preferredTime}` : ''}
                  </span>
                </div>
                {request.workerCount > 1 && (
                  <div className="flex items-center gap-2 text-ink-700">
                    <Users size={16} className="text-ink-500 shrink-0" />
                    <span>{request.workerCount} workers · {request.durationDays} day{request.durationDays > 1 ? 's' : ''}</span>
                  </div>
                )}
                {(request.budget || request.finalPrice) && (
                  <div className="flex items-center gap-2 text-ink-700">
                    <IndianRupee size={16} className="text-ink-500 shrink-0" />
                    <span>
                      {request.finalPrice ? `₹${request.finalPrice} (confirmed)` : `₹${request.budget} (your budget)`}
                    </span>
                  </div>
                )}
              </div>

              {request.assignedWorkerId && (
                <div className="mt-4 bg-mint-50 rounded-lg p-3 flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-full bg-mint-100 text-mint-600 flex items-center justify-center text-xs font-bold">
                    {request.assignedWorkerId.name?.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-mint-700">A worker has been arranged</p>
                    <p className="text-xs text-mint-600">KamWala will coordinate the visit for you.</p>
                  </div>
                </div>
              )}

              {request.finalPrice && request.paymentStatus !== 'paid' && (
                <Button className="w-full mt-4" onClick={handlePayNow} disabled={paying}>
                  {paying ? 'Opening payment…' : `Pay ₹${request.finalPrice} now`}
                </Button>
              )}

              <div className="flex gap-2 mt-4">
                {!['completed', 'cancelled'].includes(request.status) && (
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling}>
                    <XCircle size={14} /> {cancelling ? 'Cancelling…' : 'Cancel request'}
                  </Button>
                )}
                {request.status === 'completed' && (
                  <Button variant="outline" size="sm" onClick={handleRepeat} disabled={repeating}>
                    <Repeat size={14} /> {repeating ? 'Creating…' : 'Book again'}
                  </Button>
                )}
              </div>
            </div>

            {!['cancelled', 'disputed'].includes(request.status) && (
              <div className="bg-white rounded-card border border-cloud-200 p-5 shadow-soft">
                <h2 className="font-display font-semibold text-sm mb-4">Status timeline</h2>
                <ol>
                  {STATUS_FLOW.map((s, i) => {
                    const reached = STATUS_FLOW.indexOf(request.status) >= i || request.status === 'completed';
                    const isCurrent = request.status === s;
                    return (
                      <li key={s} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`h-3 w-3 rounded-full shrink-0 ${reached ? 'bg-brand-500' : 'bg-cloud-200'} ${
                              isCurrent ? 'ring-4 ring-brand-100' : ''
                            }`}
                          />
                          {i < STATUS_FLOW.length - 1 && (
                            <span className={`w-px flex-1 ${reached ? 'bg-brand-200' : 'bg-cloud-200'}`} style={{ minHeight: 22 }} />
                          )}
                        </div>
                        <p className={`text-sm pb-5 capitalize ${reached ? 'text-ink-900 font-medium' : 'text-ink-500'}`}>
                          {s.replace(/_/g, ' ')}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {request.status === 'completed' && (
              <div className="bg-white rounded-card border border-cloud-200 p-5 shadow-soft">
                <h2 className="font-display font-semibold text-sm mb-3">Rate this service</h2>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                      <Star size={22} className={n <= rating ? 'fill-amber-500 text-amber-500' : 'text-cloud-200'} />
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={2}
                  placeholder="How was your experience? (optional)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
                <Button size="sm" className="mt-3" onClick={handleReviewSubmit} disabled={submittingReview}>
                  {submittingReview ? 'Submitting…' : 'Submit review'}
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-card border border-cloud-200 shadow-soft flex flex-col h-[520px]">
            <div className="px-4 py-3.5 border-b border-cloud-200">
              <p className="font-display font-semibold text-sm">Chat with KamWala</p>
              <p className="text-xs text-ink-500">We manage worker contact for you — questions go here.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-ink-500 text-center mt-8">No messages yet. Ask us anything about this request.</p>
              )}
              {messages.map((m) => (
                <ChatBubble key={m._id} role={m.senderRole === 'customer' ? 'user' : 'assistant'}>
                  {m.message}
                </ChatBubble>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} className="flex items-center gap-2 px-3 py-3 border-t border-cloud-200">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-cloud-50 border border-cloud-200 rounded-pill px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                aria-label="Send"
                className="h-9 w-9 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-brand-600 transition-colors shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
