import { api } from './client';

export const registerCustomer = (payload) => api.post('/auth/register', payload, { auth: false });

export const getMyWorkerProfile = () => api.get('/worker/me');
export const updateMyWorkerProfile = (payload) => api.patch('/worker/me', payload);
export const setAvailability = (availability) => api.patch('/worker/me/availability', { availability });
export const getAvailableWork = () => api.get('/worker/available-work');
export const acceptWork = (requestId) => api.post(`/worker/requests/${requestId}/accept`);
export const getMyBookings = () => api.get('/worker/bookings');
export const updateBookingStatus = (requestId, status, otp) =>
  api.patch(`/worker/bookings/${requestId}/status`, otp ? { status, otp } : { status });
export const requestCompletionOtp = (requestId) =>
  api.post(`/worker/bookings/${requestId}/request-completion-otp`);

// Commission payment (worker pays their platform commission after a
// completed job) - same Razorpay pattern as the customer service payment.
export const createCommissionOrder = (requestId) => api.post(`/worker/commission/${requestId}/create-order`);
export const verifyCommissionPayment = (payload) => api.post('/worker/commission/verify', payload);
