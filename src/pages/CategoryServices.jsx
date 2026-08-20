import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { CardSkeleton, EmptyState } from '../components/States';
import { Button, Input } from '../components/Form';
import { Modal } from '../components/Modal';
import { getCategories, getServices, createRequest } from '../api/misc';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CategoryServices() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const { push } = useToast();

  const [category, setCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingService, setBookingService] = useState(null);
  const [form, setForm] = useState({ fullAddress: '', city: '', pincode: '', preferredTime: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(), getServices(categoryId)])
      .then(([cats, svcs]) => {
        setCategory(cats.find((c) => c._id === categoryId) || null);
        setServices(svcs);
      })
      .catch(() => {
        setCategory(null);
        setServices([]);
      })
      .finally(() => setLoading(false));
  }, [categoryId]);

  const openBooking = (service) => {
    if (!isAuthed) {
      navigate('/login');
      return;
    }
    setBookingService(service);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.fullAddress || !form.city || !form.pincode) {
      push('Please fill in your full address, city and pincode.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createRequest({
        serviceCategory: category?.name || 'Service',
        service: bookingService.name,
        description: bookingService.description,
        address: {
          fullAddress: form.fullAddress,
          city: form.city,
          pincode: form.pincode,
        },
        preferredTime: form.preferredTime,
        selectedServiceId: bookingService._id,
      });
      push('Service booked! Track it from My Requests.', 'success');
      setBookingService(null);
      navigate(`/requests/${created.requestId}`);
    } catch (err) {
      push(err.message || 'Could not book this service.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = category ? Icons[category.icon] || Icons.Wrench : Icons.Wrench;

  return (
    <AppLayout>
      <button
        onClick={() => navigate('/categories')}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-4"
      >
        <ArrowLeft size={15} /> All categories
      </button>

      {loading && <CardSkeleton count={4} />}

      {!loading && !category && (
        <EmptyState title="Category not found" description="This category may have been removed." />
      )}

      {!loading && category && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <span className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
              <Icon size={22} />
            </span>
            <div>
              <h1 className="font-display font-bold text-xl">{category.name}</h1>
              <p className="text-sm text-ink-500">{services.length} service{services.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>

          {services.length === 0 && (
            <EmptyState
              title="No priced services listed yet"
              description="You can still describe your requirement to KamWala AI and we'll help you book it."
              action={
                <Button onClick={() => navigate('/ai-chat', { state: { category: category.name } })}>
                  Ask KamWala AI
                </Button>
              }
            />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {services.map((s) => {
              const hasDiscount = s.discountPercent > 0;
              return (
                <div
                  key={s._id}
                  className="bg-white border border-cloud-200 rounded-card p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold text-base">{s.name}</p>
                      {s.description && <p className="text-sm text-ink-500 mt-1">{s.description}</p>}
                    </div>
                    {hasDiscount && (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-500 px-2 py-1 rounded-pill">
                        <Tag size={11} /> {s.discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-bold text-xl text-brand-600">₹{s.finalPrice}</span>
                        {hasDiscount && (
                          <span className="text-sm text-ink-500 line-through">₹{s.price}</span>
                        )}
                      </div>
                      {s.estimatedTime && (
                        <p className="text-xs text-ink-500 flex items-center gap-1 mt-1">
                          <Clock size={11} /> {s.estimatedTime}
                        </p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => openBooking(s)}>
                      Book Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal
        open={!!bookingService}
        onClose={() => setBookingService(null)}
        title={bookingService ? `Book: ${bookingService.name}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setBookingService(null)}>
              Cancel
            </Button>
            <Button onClick={handleBook} disabled={submitting}>
              {submitting ? 'Booking…' : `Confirm booking — ₹${bookingService?.finalPrice ?? ''}`}
            </Button>
          </>
        }
      >
        <form onSubmit={handleBook} className="space-y-3">
          <Input
            label="Full address"
            value={form.fullAddress}
            onChange={(e) => setForm((f) => ({ ...f, fullAddress: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              label="Pincode"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
            />
          </div>
          <Input
            label="Preferred time (optional)"
            placeholder="e.g. Tomorrow morning"
            value={form.preferredTime}
            onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
          />
        </form>
      </Modal>
    </AppLayout>
  );
}
