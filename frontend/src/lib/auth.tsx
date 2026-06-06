import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('mufasa_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await loadUser(session.user.id);
      } else {
        setUser(null);
        localStorage.removeItem('mufasa_user');
      }
    });

    // Keep in sync with Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await loadUser(session.user.id);
      } else {
        setUser(null);
        localStorage.removeItem('mufasa_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async (authId: string) => {
    const { data } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role:roles(name)')
      .eq('id', authId)
      .single();

    if (data) {
      const authUser: AuthUser = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: (data.role as any)?.name || 'staff',
      };
      setUser(authUser);
      localStorage.setItem('mufasa_user', JSON.stringify(authUser));
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mufasa_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
