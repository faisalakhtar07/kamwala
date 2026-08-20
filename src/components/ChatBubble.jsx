import { Bot, User } from 'lucide-react';

export function ChatBubble({ role, children }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span
        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-cloud-100 text-ink-700' : 'bg-brand-500 text-white'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </span>
      <div
        className={`max-w-[80%] rounded-card px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-cloud-50 text-ink-900 rounded-tl-sm'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <span className="h-7 w-7 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0">
        <Bot size={14} />
      </span>
      <div className="bg-cloud-50 rounded-card rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-300 animate-typingDot" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-ink-300 animate-typingDot" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-ink-300 animate-typingDot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
