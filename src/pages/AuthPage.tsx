import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'signin' | 'signup';

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      if (user) {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.registerDM(email, password, displayName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await AuthService.signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSent(false);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>
          The DM's Marketplace
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new DM account'}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setMode('signin')}
            style={{
              flex: 1,
              padding: '10px',
              border: mode === 'signin' ? '2px solid #007bff' : '1px solid #ddd',
              backgroundColor: mode === 'signin' ? '#e7f3ff' : 'white',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: mode === 'signin' ? 'bold' : 'normal'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '10px',
              border: mode === 'signup' ? '2px solid #007bff' : '1px solid #ddd',
              backgroundColor: mode === 'signup' ? '#e7f3ff' : 'white',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: mode === 'signup' ? 'bold' : 'normal'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={mode === 'signup' ? handleEmailSignUp : handleEmailSignIn}>
          {mode === 'signup' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Dungeon Master Dave"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="dm@example.com"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 6 characters"
              minLength={6}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginBottom: '15px' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline'
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '20px 0',
          color: '#666'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }} />
          <span style={{ padding: '0 10px', fontSize: '14px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }} />
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h2 style={{ marginTop: 0 }}>Reset Password</h2>

            {resetSent ? (
              <>
                <div style={{
                  padding: '15px',
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  borderRadius: '5px',
                  marginBottom: '20px'
                }}>
                  Password reset email sent! Check your inbox and follow the instructions.
                </div>
                <button
                  onClick={closeForgotPassword}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handlePasswordReset}>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="dm@example.com"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: loading ? '#6c757d' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
