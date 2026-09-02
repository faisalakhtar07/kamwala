import { api } from './client';

export const registerCustomer = (payload) => api.post('/auth/register', payload, { auth: false });

export const getMyWorkerProfile = () => api.get('/worker/me');
export const updateMyWorkerProfile = (payload) => api.patch('/worker/me', payload);
export const setAvailability = (availability) => api.patch('/worker/me/availability', { availability });
export const getAvailableWork = () => api.get('/worker/available-work');
export const acceptWork = (requestId) => api.post(`/worker/requests/${requestId}/accept`);
export const getMyBookings = () => api.get('/worker/bookings');
export const updateBookingStatus = (requestId, status) =>
  api.patch(`/worker/bookings/${requestId}/status`, { status });
