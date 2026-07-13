import { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, saveStoredUser, clearSession, getAccountRestriction, clearAccountRestriction, saveAccountRestriction } from '../storage/session';
import { setSessionInvalidHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionNotice, setSessionNotice] = useState('');
  const [accountRestriction, setAccountRestriction] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getStoredUser(), getAccountRestriction()])
      .then(([storedUser, restriction]) => {
        if (mounted && storedUser) setUser(storedUser);
        if (mounted && restriction) setAccountRestriction(restriction);
      })
      .finally(() => {
        if (mounted) setCheckingSession(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setSessionInvalidHandler((data) => {
      const until = data.until ? ` Hasta: ${new Date(data.until).toLocaleDateString()}.` : '';
      setSessionNotice(`${data.error}${data.reason ? ` Motivo: ${data.reason}.` : ''}${until}`);
      setAccountRestriction(data);
    });
    return () => setSessionInvalidHandler(null);
  }, []);

  const handleAuth = async (nextUser) => {
    setUser(nextUser);
  };

  const handleLogout = async () => {
    await clearSession();
    setUser(null);
    setAccountRestriction(null);
  };

  const handleClearRestriction = async () => {
    await clearAccountRestriction();
    setAccountRestriction(null);
  };
  const handleAccountRestriction = async (restriction) => {
    await saveAccountRestriction(restriction);
    setAccountRestriction(restriction);
  };

  const handleUserUpdate = async (nextUser) => {
    setUser(nextUser);
    await saveStoredUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, checkingSession, sessionNotice, setSessionNotice, accountRestriction, handleClearRestriction, handleAccountRestriction, handleAuth, handleLogout, handleUserUpdate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
