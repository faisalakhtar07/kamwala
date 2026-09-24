import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { getMyProfile } from '../api/misc';
import { getToken, setToken, clearToken, getRole, setRole, clearRole } from '../api/client';
import { enablePushNotifications, disablePushNotifications } from '../utils/push';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRoleState] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setInitializing(false);
      return;
    }
    getMyProfile()
      .then((u) => {
        setUser(u);
        setRoleState(u.role || getRole());
        // Silently (re)register this device for real push notifications -
        // e.g. after a page reload with an already-logged-in session.
        enablePushNotifications();
      })
      .catch(() => {
        clearToken();
        clearRole();
      })
      .finally(() => setInitializing(false));
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.registerCustomer(payload);
    setToken(data.token);
    setRole(data.user.role);
    setUser(data.user);
    setRoleState(data.user.role);
    enablePushNotifications();
    return data;
  }, []);

  const login = useCallback(async (mobile, password) => {
    const data = await authApi.login(mobile, password);
    setToken(data.token);
    setRole(data.user.role);
    setUser(data.user);
    setRoleState(data.user.role);
    enablePushNotifications();
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await getMyProfile();
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(() => {
    disablePushNotifications();
    clearToken();
    clearRole();
    setUser(null);
    setRoleState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, role, initializing, isAuthed: !!user, register, login, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
