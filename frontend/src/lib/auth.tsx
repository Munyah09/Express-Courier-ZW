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
    const stored = localStorage.getItem('mufasa_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('mufasa_token');
  });

  useEffect(() => {
    if (accessToken) {
      setToken(accessToken);
    }
  }, [accessToken]);

  const login = (token: string, refreshToken: string, authUser: AuthUser) => {
    localStorage.setItem('mufasa_token', token);
    localStorage.setItem('mufasa_refresh', refreshToken);
    localStorage.setItem('mufasa_user', JSON.stringify(authUser));
    setToken(token);
    setAccessToken(token);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('mufasa_token');
    localStorage.removeItem('mufasa_refresh');
    localStorage.removeItem('mufasa_user');
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
