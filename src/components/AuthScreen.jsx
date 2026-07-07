import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, X, Zap } from 'lucide-react';

/**
 * AuthScreen — Modal overlay with Sign In / Create Account tabs.
 *
 * Props:
 *   onSignIn(email, password)  — called on login attempt
 *   onSignUp(email, password)  — called on signup attempt
 *   onClose()                  — dismiss the modal
 */
export function AuthScreen({ onSignIn, onSignUp, onClose }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (tab === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'signin') {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
        setSuccess('Account created! You can now use the app.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '14px 16px 14px 44px',
    color: '#111827',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px',
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '24px',
        maxWidth: '440px',
        width: '100%',
        padding: '40px',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
        >
          <X size={18} />
        </button>

        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(29,78,216,0.1), rgba(37,99,235,0.15))',
            border: '1px solid rgba(29,78,216,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Zap size={22} color="#1D4ED8" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#111827', margin: '0 0 4px' }}>
            Welcome to Groundwork
          </h2>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
            Practice conversations that matter
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '28px', background: '#F3F4F6', borderRadius: '10px', padding: '3px' }}>
          {['signin', 'signup'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setSuccess(null); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: tab === t ? '600' : '400',
                color: tab === t ? '#111827' : '#6B7280',
                background: tab === t ? '#FFFFFF' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Mail size={16} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative', marginBottom: tab === 'signup' ? '14px' : '8px' }}>
            <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              style={inputStyle}
            />
          </div>

          {/* Confirm password (signup only) */}
          {tab === 'signup' && (
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                style={inputStyle}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px',
              padding: '10px 14px', marginTop: '12px',
            }}>
              <AlertCircle size={14} color="#DC2626" />
              <span style={{ fontSize: '12px', color: '#DC2626' }}>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px',
              padding: '10px 14px', marginTop: '12px',
            }}>
              <span style={{ fontSize: '12px', color: '#16A34A' }}>{success}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '15px',
              background: loading ? '#E5E7EB' : 'linear-gradient(135deg, #1D4ED8, #2563EB)',
              color: loading ? '#9CA3AF' : '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(29,78,216,0.25)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading && <Loader2 size={16} className="spin" />}
            {tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '20px', letterSpacing: '0.04em' }}>
          Your data is stored securely in Supabase
        </p>
      </div>
    </div>
  );
}
