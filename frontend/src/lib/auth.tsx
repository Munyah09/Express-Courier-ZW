import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setToken } from './api';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('starverse_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('starverse_token');
  });

  useEffect(() => {
    // Sync the stored token into axios on mount (handles page refresh)
    const stored = localStorage.getItem('starverse_token');
    if (stored) setToken(stored);
  }, []);

  const login = (token: string, refreshToken: string, authUser: AuthUser) => {
    localStorage.setItem('starverse_token', token);
    localStorage.setItem('starverse_refresh', refreshToken);
    localStorage.setItem('starverse_user', JSON.stringify(authUser));
    setToken(token);
    setAccessToken(token);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('starverse_token');
    localStorage.removeItem('starverse_refresh');
    localStorage.removeItem('starverse_user');
    setToken('');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
