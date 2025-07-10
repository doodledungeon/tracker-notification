import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export default function AuthModal({ open, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: '#232323', padding: 32, borderRadius: 16, minWidth: 320, boxShadow: '0 4px 32px #000a', position: 'relative', color: '#fff' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }} title="Close">×</button>
        <h2 style={{ margin: 0, marginBottom: 18, textAlign: 'center', fontWeight: 700 }}>{isRegister ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 8, border: '1px solid #444', background: '#181818', color: '#fff', fontSize: 16 }}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 8, border: '1px solid #444', background: '#181818', color: '#fff', fontSize: 16 }}
          />
          {error && <div style={{ color: '#ff4b4b', fontSize: 14, marginTop: 4 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: 12, borderRadius: 8, background: '#4f8cff', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer', marginTop: 8 }}>
            {loading ? (isRegister ? 'Registering...' : 'Logging in...') : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>
        <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', marginTop: 14, padding: 12, borderRadius: 8, background: '#fff', color: '#232323', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔵</span> Sign in with Google
        </button>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button onClick={() => setIsRegister(r => !r)} style={{ background: 'none', border: 'none', color: '#4f8cff', cursor: 'pointer', fontSize: 15 }}>
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
} 