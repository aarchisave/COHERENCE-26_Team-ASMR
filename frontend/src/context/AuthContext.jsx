import React, { createContext, useContext, useState, useEffect } from 'react';
console.log('📍 AuthContext.jsx file loaded');
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🕵️ AuthContext: Setting up onAuthStateChanged...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('👤 Firebase Auth State Changed:', firebaseUser ? firebaseUser.email : 'No User');
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        console.log('🔑 Token acquired:', token.substring(0, 10) + '...');
        localStorage.setItem('bfiq_token', token);
        setUser({
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          uid: firebaseUser.uid
        });
      } else {
        console.log('🚪 No user found, clearing token.');
        localStorage.removeItem('bfiq_token');
        setUser(null);
      }
      console.log('🏁 AuthContext: Setting loading to false');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function login(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuth: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
