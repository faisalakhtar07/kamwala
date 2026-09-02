import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Bot, CheckCircle2, Pencil } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { ChatBubble, TypingIndicator } from '../components/ChatBubble';
import { Button, Input, Textarea } from '../components/Form';
import { sendChatMessage, createRequestFromSummary } from '../api/ai';
import { useToast } from '../context/ToastContext';

export default function AIChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { push } = useToast();
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ fullAddress: '', city: '', pincode: '' });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, summary]);

  // Kick off the conversation with whatever context brought the customer here.
  useEffect(() => {
    const seed = location.state?.initialMessage?.trim();
    const category = location.state?.category;
    const opener = seed || (category ? `Mujhe ${category} ke liye kaam chahiye.` : null);
    if (opener) {
      sendMessage(opener);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Namaste! Main KamWala AI hoon. Aapko kis kaam ke liye worker chahiye? 🤖",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const data = await sendChatMessage(nextMessages);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      if (data.summary?.ready) {
        setSummary(data.summary);
        setAddressForm((f) => ({ ...f, fullAddress: data.summary.location || f.fullAddress, city: f.city, pincode: data.summary.pincode || f.pincode }));
      }
    } catch (err) {
      push(err.message || 'KamWala AI is having trouble right now.', 'error');
      setMessages((m) => m.slice(0, -1)); // roll back the optimistic user message on failure
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleEditRequirement = () => {
    setSummary(null);
    sendMessage('Actually I want to change some details.');
  };

  const handleConfirm = async () => {
    if (!addressForm.fullAddress || !addressForm.city || !addressForm.pincode) {
      setEditingAddress(true);
      return;
    }
    setConfirming(true);
    try {
      const request = await createRequestFromSummary({
        category: summary.category,
        description: summary.description,
        workerCount: summary.workerCount,
        durationDays: summary.durationDays,
        startDate: summary.startDate,
        preferredTime: summary.preferredTime,
        budget: summary.budget,
        fullAddress: addressForm.fullAddress,
        city: addressForm.city,
        pincode: addressForm.pincode,
      });
      push('Request submitted! KamWala will arrange a worker shortly.', 'success');
      navigate(`/requests/${request.requestId}`);
    } catch (err) {
      push(err.message || 'Could not submit your request.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AppLayout noPadding>
      <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 md:px-0 py-4 border-b border-cloud-200">
          <span className="h-9 w-9 rounded-full bg-brand-500 text-white flex items-center justify-center">
            <Bot size={18} />
          </span>
          <div>
            <p className="font-display font-semibold text-sm">KamWala AI</p>
            <p className="text-xs text-ink-500">Tell it what work you need — it'll handle the rest</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-2 py-4 space-y-4">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role}>
              {m.content}
            </ChatBubble>
          ))}
          {sending && <TypingIndicator />}

          {summary && (
            <div className="bg-white border border-brand-200 rounded-card p-5 shadow-soft mt-2">
              <p className="font-display font-semibold text-sm mb-3">Requirement Summary</p>
              <dl className="space-y-2 text-sm">
                <Row label="Work" value={summary.category} />
                <Row label="Details" value={summary.description} />
                {summary.workerCount > 1 && <Row label="Workers" value={summary.workerCount} />}
                <Row label="Duration" value={`${summary.durationDays || 1} Day${summary.durationDays > 1 ? 's' : ''}`} />
                {summary.startDate && <Row label="Start Date" value={summary.startDate} />}
                {summary.preferredTime && <Row label="Preferred Time" value={summary.preferredTime} />}
                {summary.budget && <Row label="Budget" value={`₹${summary.budget}`} />}
              </dl>

              {!editingAddress ? (
                <button
                  onClick={() => setEditingAddress(true)}
                  className="mt-3 flex items-center gap-1.5 text-sm text-brand-600 font-medium"
                >
                  <Pencil size={13} />
                  {addressForm.fullAddress ? 'Edit address' : 'Add your address to confirm'}
                </button>
              ) : (
                <div className="mt-3 space-y-2.5">
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
                  <Button size="sm" variant="outline" onClick={() => setEditingAddress(false)}>
                    Done
                  </Button>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={handleEditRequirement}>
                  Edit Requirement
                </Button>
                <Button className="flex-1" onClick={handleConfirm} disabled={confirming}>
                  <CheckCircle2 size={16} />
                  {confirming ? 'Confirming…' : 'Confirm Request'}
                </Button>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        {!summary && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 md:px-0 py-3 border-t border-cloud-200">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your requirement…"
              disabled={sending}
              className="flex-1 bg-cloud-50 border border-cloud-200 rounded-pill px-4 py-3 text-sm outline-none focus:border-brand-400 transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="h-11 w-11 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-brand-600 transition-colors shrink-0"
            >
              <Send size={17} />
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900 text-right">{value}</dd>
    </div>
  );
}
