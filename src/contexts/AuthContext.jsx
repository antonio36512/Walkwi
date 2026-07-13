import { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, saveStoredUser, clearSession } from '../storage/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    getStoredUser()
      .then((storedUser) => {
        if (mounted && storedUser) setUser(storedUser);
      })
      .finally(() => {
        if (mounted) setCheckingSession(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleAuth = async (nextUser) => {
    setUser(nextUser);
  };

  const handleLogout = async () => {
    await clearSession();
    setUser(null);
  };

  const handleUserUpdate = async (nextUser) => {
    setUser(nextUser);
    await saveStoredUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, checkingSession, handleAuth, handleLogout, handleUserUpdate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
