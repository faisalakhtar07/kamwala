export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    secondary: 'bg-cloud-100 text-ink-900 hover:bg-cloud-200',
    outline: 'border border-cloud-200 text-ink-900 hover:bg-cloud-50',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    ghost: 'text-ink-700 hover:bg-cloud-50',
  };
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2.5', lg: 'text-base px-5 py-3.5' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink-700 mb-1.5">{label}</span>}
      <input
        className={`w-full rounded-lg border ${error ? 'border-rose-500' : 'border-cloud-200'} bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
    </label>
  );
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink-700 mb-1.5">{label}</span>}
      <textarea
        className={`w-full rounded-lg border border-cloud-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors resize-none ${className}`}
        {...props}
      />
    </label>
  );
}
