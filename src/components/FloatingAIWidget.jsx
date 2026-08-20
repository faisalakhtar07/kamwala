import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Send, ArrowRight } from 'lucide-react';
import { ChatBubble, TypingIndicator } from './ChatBubble';
import { sendChatMessage } from '../api/ai';
import { useAuth } from '../context/AuthContext';

const GREETING = "Hi! I'm KamWala AI. Tell me what work you need done, and I'll help you find the right service.";

export default function FloatingAIWidget() {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleOpen = () => {
    if (!isAuthed) {
      navigate('/login');
      return;
    }
    setOpen(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const data = await sendChatMessage(nextMessages);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: "Sorry, I couldn't respond right now. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Open KamWala AI assistant"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 h-14 w-14 rounded-full bg-brand-500 text-white shadow-pop flex items-center justify-center hover:bg-brand-600 hover:scale-105 transition-all duration-300"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[520px] bg-white rounded-card shadow-pop border border-cloud-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-cloud-200 bg-brand-50">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-full bg-brand-500 text-white flex items-center justify-center">
                <Bot size={16} />
              </span>
              <div>
                <p className="font-display font-semibold text-sm">KamWala AI</p>
                <p className="text-xs text-ink-500">Here to help you book the right service</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="h-8 w-8 rounded-full flex items-center justify-center text-ink-500 hover:bg-white hover:text-ink-900 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role === 'user' ? 'user' : 'assistant'}>
                {m.content}
              </ChatBubble>
            ))}
            {sending && <TypingIndicator />}
            <div ref={endRef} />
          </div>

          <div className="border-t border-cloud-200 p-3">
            <button
              onClick={() => navigate('/ai-chat')}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 mb-2.5"
            >
              Open full booking chat <ArrowRight size={13} />
            </button>
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your requirement…"
                className="flex-1 bg-cloud-50 border border-cloud-200 rounded-pill px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="h-9 w-9 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-brand-600 transition-colors shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
