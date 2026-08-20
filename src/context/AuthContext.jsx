import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { getMyProfile } from '../api/misc';
import { getToken, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setInitializing(false);
      return;
    }
    getMyProfile()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setInitializing(false));
  }, []);

  // payload: { userType, name, mobile, password, confirmPassword, email,
  //            categories, services, experienceYears, address, city }
  const register = useCallback(async (payload) => {
    const data = await authApi.registerCustomer(payload);
    setToken(data.token);
    setUser(data.user);
    return data; // includes workerApplication if userType was 'worker'
  }, []);

  const login = useCallback(async (mobile, password) => {
    const data = await authApi.login(mobile, password);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await getMyProfile();
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, isAuthed: !!user, register, login, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
