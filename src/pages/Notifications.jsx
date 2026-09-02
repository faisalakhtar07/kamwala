import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { CardSkeleton, EmptyState } from '../components/States';
import { Button } from '../components/Form';
import { getNotifications, markAllNotificationsRead } from '../api/misc';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getNotifications({})
      .then((d) => setNotifications(d.notifications || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-bold text-xl">Notifications</h1>
        <Button size="sm" variant="ghost" onClick={() => markAllNotificationsRead().then(load)}>
          Mark all read
        </Button>
      </div>

      {loading && <CardSkeleton count={4} />}

      {!loading && notifications.length === 0 && (
        <EmptyState icon={Bell} title="No notifications yet" description="Updates about your requests will show up here." />
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <Link
            key={n._id}
            to="/dashboard"
            className={`block rounded-card border p-4 transition-colors ${
              n.read ? 'bg-white border-cloud-200' : 'bg-brand-50 border-brand-100'
            }`}
          >
            <p className="text-sm font-semibold">{n.title}</p>
            <p className="text-sm text-ink-700 mt-0.5">{n.message}</p>
            <p className="text-xs text-ink-500 mt-1.5 tabular">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
