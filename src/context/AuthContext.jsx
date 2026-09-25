import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { getMyProfile } from '../api/misc';
import { getMyWorkerProfile } from '../api/worker';
import { getToken, setToken, clearToken, getRole, setRole, clearRole } from '../api/client';
import { enablePushNotifications, disablePushNotifications } from '../utils/push';

const AuthContext = createContext(null);

// `/customers/me` only accepts a customer token and `/worker/me` only
// accepts a worker token - calling the wrong one for the logged-in role
// returns 401, which the API client treats as "session invalid" and wipes
// the token. THIS was why workers got force-logged-out on every refresh:
// the app always called the customer endpoint regardless of who was
// actually logged in. Route to the right endpoint based on stored role.
const fetchProfileForRole = (storedRole) =>
  storedRole === 'worker' ? getMyWorkerProfile() : getMyProfile();

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
    const storedRole = getRole();
    fetchProfileForRole(storedRole)
      .then((u) => {
        setUser(u);
        setRoleState(u.role || storedRole);
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
    const updated = await fetchProfileForRole(role || getRole());
    setUser(updated);
    return updated;
  }, [role]);

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
