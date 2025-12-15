import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'notifications'), {
        email: email.trim(),
        createdAt: Timestamp.now()
      });

      setSubmitted(true);
      setEmail('');
    } catch (err: any) {
      setError('Failed to save your information. Please try again.');
      console.error('Error saving notification:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background: #0d1117;
        }
        input::placeholder {
          color: #6e7681;
          opacity: 1;
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"'
      }}>
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 0%, rgba(56, 139, 253, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '700px',
        width: '100%',
        backgroundColor: '#161b22',
        padding: '64px 56px',
        borderRadius: '12px',
        border: 'none',
        boxShadow: 'none',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 style={{
          fontSize: '48px',
          marginBottom: '16px',
          color: '#f0f6fc',
          fontWeight: '600',
          letterSpacing: '-0.5px'
        }}>
          The DM's Marketplace
        </h1>

        <p style={{
          fontSize: '18px',
          lineHeight: '1.7',
          color: '#8b949e',
          marginBottom: '16px',
          fontWeight: '400'
        }}>
          Thank you for using the first version of this website! Right now we are currently undergoing major changes.
          Super exciting features will be added! You will be able to have your own account and save your markets.
        </p>

        <p style={{
          fontSize: '16px',
          color: '#6e7681',
          marginBottom: '48px',
          fontWeight: '400'
        }}>
          Thank you for your patience, we will be back soon.
        </p>

        {/* Email Signup */}
        <div style={{
          marginBottom: '48px',
          paddingTop: '40px',
          borderTop: '1px solid #30363d'
        }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '24px',
            color: '#c9d1d9',
            fontWeight: '600',
            letterSpacing: '-0.3px'
          }}>
            Want to receive a notification when we launch?
          </h2>

          {submitted ? (
            <div style={{
              padding: '16px 24px',
              backgroundColor: 'rgba(56, 139, 253, 0.15)',
              borderRadius: '8px',
              border: '1px solid rgba(56, 139, 253, 0.3)'
            }}>
              <p style={{
                color: '#58a6ff',
                fontSize: '15px',
                fontWeight: '500',
                margin: 0
              }}>
                Thank you! We'll notify you when we're ready.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '480px',
                margin: '0 auto'
              }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    padding: '12px 16px',
                    fontSize: '14px',
                    backgroundColor: '#0d1117',
                    color: '#c9d1d9',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#58a6ff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#30363d';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    marginTop: '8px',
                    background: loading ? '#21262d' : '#238636',
                    color: loading ? '#6e7681' : '#ffffff',
                    border: '1px solid',
                    borderColor: loading ? '#30363d' : '#238636',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'background-color 0.2s',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#2ea043';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#238636';
                    }
                  }}
                >
                  {loading ? 'Saving...' : 'Confirm'}
                </button>
              </form>
              {error && (
                <p style={{
                  color: '#f85149',
                  fontSize: '13px',
                  marginTop: '12px',
                  fontWeight: '400'
                }}>
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* GitHub Link */}
        <div style={{
          paddingTop: '40px',
          borderTop: '1px solid #30363d'
        }}>
          <p style={{
            fontSize: '15px',
            color: '#8b949e',
            marginBottom: '16px',
            fontWeight: '400'
          }}>
            Curious about the progress?
          </p>
          <a
            href="https://github.com/paulinadupin/the-dms-marketplace"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#21262d',
              color: '#c9d1d9',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid #30363d',
              transition: 'background-color 0.2s, border-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#30363d';
              e.currentTarget.style.borderColor = '#8b949e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#21262d';
              e.currentTarget.style.borderColor = '#30363d';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            View on GitHub
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
