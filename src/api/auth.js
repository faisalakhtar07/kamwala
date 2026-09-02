import { api } from './client';

export const registerCustomer = (payload) => api.post('/auth/register', payload, { auth: false });
export const login = (mobile, password) => api.post('/auth/login', { mobile, password }, { auth: false });
