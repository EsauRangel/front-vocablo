import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, authToken, User } from '../api/client';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authToken.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      if (!authToken.get()) {
        setLoading(false);
        return;
      }

      try {
        setUser(await api.auth.me());
      } catch {
        authToken.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    authToken.set(response.accessToken);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const response = await api.auth.register(email, password, name);
      authToken.set(response.accessToken);
      setUser(response.user);
    },
    [],
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
