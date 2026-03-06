import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bfiq_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('bfiq_user');
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, [token]);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('bfiq_token', data.token);
      localStorage.setItem('bfiq_user', JSON.stringify(data.user));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bfiq_token');
    localStorage.removeItem('bfiq_user');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
