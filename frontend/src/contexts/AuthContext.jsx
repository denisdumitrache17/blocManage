import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((res) => {
        const u = res.data.user;
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return res.data;
  }, []);

  const registerTenant = useCallback(async (data) => {
    const res = await api.post('/auth/register/tenant', data);
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return res.data;
  }, []);

  const registerHoa = useCallback(async (data) => {
    const res = await api.post('/auth/register/hoa', data);
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return res.data;
  }, []);

  const registerFirm = useCallback(async (data) => {
    const res = await api.post('/auth/register/firm', data);
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    registerTenant,
    registerHoa,
    registerFirm
  }), [user, loading, login, logout, registerTenant, registerHoa, registerFirm]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth trebuie folosit in interiorul AuthProvider');
  return ctx;
}
