import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) navigate('/');
    else setError(result.error);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg-page)' }}>
      <div style={{ width:'100%', maxWidth:'420px', padding:'40px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-lg)' }}>
        <div style={{ textAlign:'center', marginBottom:'30px' }}>
          <div className="brand-wordmark">
            <h1 style={{ fontSize:'1.5rem', color:'var(--text-primary)', marginBottom:'4px' }}>BudgetFlow IQ</h1>
            <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>GovTech Intelligence Platform (v1.0.1-fire)</p>
          </div>
        </div>

        {error && (
          <div style={{ color:'var(--color-danger)', background:'var(--color-danger-bg)', padding:'10px', borderRadius:'var(--r-sm)', fontSize:'0.8rem', marginBottom:'16px', textAlign:'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'6px' }}>Official Email / User ID</label>
            <input type="email" className="filter-select" placeholder="admin@gov.in" value={email} onChange={e => setEmail(e.target.value)} required style={{ width:'100%', padding:'10px 14px', fontSize:'0.9rem' }} />
          </div>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'6px' }}>Security Password</label>
            <input type="password" className="filter-select" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width:'100%', padding:'10px 14px', fontSize:'0.9rem' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', background:'var(--accent)', color:'white', border:'none', borderRadius:'var(--r-md)', fontSize:'0.95rem', fontWeight:600, cursor:'pointer', marginTop:'10px', transition:'background var(--transition)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ display:'flex', alignItems:'center', textAlign:'center', margin:'24px 0', color:'var(--text-muted)', fontSize:'0.8rem' }}>
          <hr style={{ flex:1, border:'none', borderTop:'1px solid var(--border)' }} />
          <span style={{ padding:'0 12px' }}>OR</span>
          <hr style={{ flex:1, border:'none', borderTop:'1px solid var(--border)' }} />
        </div>

        <button type="button" onClick={handleGoogleSignIn} disabled={loading} style={{ width:'100%', padding:'10px', background:'var(--bg-surface)', color:'var(--text-primary)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', fontSize:'0.9rem', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', transition:'background var(--transition)', opacity: loading ? 0.7 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google Workspace
        </button>
      </div>
    </div>
  );
}
