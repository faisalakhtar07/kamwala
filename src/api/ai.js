import { api } from './client';

export const sendChatMessage = (messages) => api.post('/ai/chat', { messages });

export const createRequestFromSummary = (summary) => api.post('/ai/create-request', summary);
