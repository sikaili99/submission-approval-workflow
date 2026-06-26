import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client.js';
import type { User } from '../api/types.js';

interface AuthState {
  user: User | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (token: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');

  const resolve = useCallback(async () => {
    if (!getToken()) {
      setStatus('anonymous');
      return;
    }
    try {
      const { user: u } = await api.get<{ user: User }>('/me');
      setUser(u);
      setStatus('authenticated');
    } catch {
      clearToken();
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  const login = useCallback(async (token: string): Promise<User> => {
    setToken(token);
    const { user: u } = await api.get<{ user: User }>('/me');
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
