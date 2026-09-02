import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Bot } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States';
import { StatusPill, RequestIdTag } from '../components/StatusPill';
import { Button } from '../components/Form';
import { getMyRequests } from '../api/misc';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getMyRequests(tab)
      .then(setRequests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  return (
    <AppLayout>
      <h1 className="font-display font-bold text-xl mb-1">Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h1>
      <p className="text-sm text-ink-500 mb-5">Track your requests and bookings here.</p>

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`whitespace-nowrap rounded-pill px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-brand-500 text-white' : 'bg-white border border-cloud-200 text-ink-700 hover:bg-cloud-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && loading && <CardSkeleton count={3} />}

      {!error && !loading && requests.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No requests yet"
          description="Tell KamWala AI what work you need, and it'll show up here."
          action={
            <Link to="/ai-chat">
              <Button><Bot size={16} /> Ask KamWala AI</Button>
            </Link>
          }
        />
      )}

      {!error && !loading && requests.length > 0 && (
        <div className="space-y-2.5">
          {requests.map((r) => (
            <Link
              key={r._id}
              to={`/requests/${r.requestId}`}
              className="block bg-white border border-cloud-200 rounded-card p-4 hover:border-brand-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <RequestIdTag id={r.requestId} size="sm" />
                <StatusPill status={r.status} />
              </div>
              <p className="text-sm font-semibold mt-2">{r.service}</p>
              <p className="text-xs text-ink-500 mt-0.5">
                {r.workerCount > 1 ? `${r.workerCount} workers · ` : ''}
                {r.durationDays > 1 ? `${r.durationDays} days · ` : ''}
                {r.address?.city}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
