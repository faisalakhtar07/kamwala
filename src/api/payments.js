import { api } from './client';

export const createPaymentOrder = (requestId, amount) => api.post('/payments/create', { requestId, amount });
export const verifyPayment = (payload) => api.post('/payments/verify', payload);
