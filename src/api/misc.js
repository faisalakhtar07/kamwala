import { api } from './client';

// Categories
export const getCategories = () => api.get('/categories');

// Services (priced catalog items under a category)
export const getServices = (categoryId) =>
  api.get(`/services${categoryId ? `?category=${categoryId}` : ''}`);
export const getServiceDetail = (id) => api.get(`/services/${id}`);

// Customer profile
export const getMyProfile = () => api.get('/customers/me');
export const updateMyProfile = (payload) => api.patch('/customers/me', payload);
export const addAddress = (payload) => api.post('/customers/me/addresses', payload);

// Requests
export const createRequest = (payload) => api.post('/requests', payload);
export const getMyRequests = (status) => api.get(`/requests${status ? `?status=${status}` : ''}`);
export const getRequestDetail = (requestId) => api.get(`/requests/${requestId}`);
export const cancelRequest = (requestId, reason) => api.patch(`/requests/${requestId}/cancel`, { reason });
export const repeatRequest = (requestId) => api.post(`/requests/${requestId}/repeat`);

// Reviews
export const submitReview = (payload) => api.post('/reviews', payload);

// Support
export const createTicket = (payload) => api.post('/support/tickets', payload);
export const getMyTickets = () => api.get('/support/tickets');

// Chat
export const getChatMessages = (requestId) => api.get(`/chat/${requestId}`);
export const sendChatToOwner = (requestId, message) => api.post(`/chat/${requestId}`, { message });

// Notifications
export const getNotifications = (params) =>
  api.get(`/notifications${params?.unreadOnly ? '?unreadOnly=true' : ''}`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
