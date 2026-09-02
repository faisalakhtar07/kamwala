const STATUS_CONFIG = {
  new: { label: 'Request received', dot: 'bg-brand-500', text: 'text-brand-700', bg: 'bg-brand-50' },
  under_review: { label: 'Under review', dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50' },
  contacted: { label: 'KamWala contacted you', dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50' },
  worker_being_arranged: { label: 'Arranging a worker', dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50' },
  price_pending: { label: 'Price pending', dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50' },
  awaiting_customer_confirmation: { label: 'Awaiting your confirmation', dot: 'bg-brand-500', text: 'text-brand-700', bg: 'bg-brand-50' },
  assigned: { label: 'Worker assigned', dot: 'bg-mint-500', text: 'text-mint-600', bg: 'bg-mint-50' },
  worker_on_the_way: { label: 'On the way', dot: 'bg-mint-500', text: 'text-mint-600', bg: 'bg-mint-50' },
  in_progress: { label: 'In progress', dot: 'bg-mint-500', text: 'text-mint-600', bg: 'bg-mint-50' },
  completed: { label: 'Completed', dot: 'bg-ink-500', text: 'text-ink-700', bg: 'bg-cloud-100' },
  cancelled: { label: 'Cancelled', dot: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-50' },
  disputed: { label: 'Disputed', dot: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-50' },
};

export function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function RequestIdTag({ id, size = 'md' }) {
  const sizing = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  return (
    <span className={`waybill inline-flex items-center rounded-[6px] border border-dashed border-ink-300 bg-cloud-50 text-ink-700 ${sizing}`}>
      {id}
    </span>
  );
}

export { STATUS_CONFIG };
