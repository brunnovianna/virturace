import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { getToken, logout, userFromToken } from '../api/session';
import type { SessionUser } from '../types';

interface AuthContextValue {
  user: SessionUser | null;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() =>
    userFromToken(getToken())
  );

  const signIn = useCallback((next: SessionUser) => setUser(next), []);
  const signOut = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

/** O usuário logado — usar só em páginas protegidas por RequireAuth. */
export function useUser(): SessionUser {
  const { user } = useAuth();
  if (!user) throw new Error('useUser em rota sem RequireAuth');
  return user;
}
