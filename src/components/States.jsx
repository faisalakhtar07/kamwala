export function CardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 rounded-card bg-cloud-100 animate-pulse" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-cloud-100 flex items-center justify-center text-ink-500 mb-3">
          <Icon size={22} />
        </div>
      )}
      <p className="font-display font-semibold text-ink-900">{title}</p>
      {description && <p className="text-sm text-ink-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <p className="font-display font-semibold text-rose-500">Couldn't load this</p>
      <p className="text-sm text-ink-500 mt-1 max-w-sm">{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-700">
          Try again
        </button>
      )}
    </div>
  );
}
