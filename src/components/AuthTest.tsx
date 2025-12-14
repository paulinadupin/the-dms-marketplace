import { useState } from 'react';
import { AuthService } from '../services/auth.service';

export function AuthTest() {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const user = await AuthService.registerDM(email, password, displayName);
      setMessage(`✅ Account created successfully! Welcome, ${user.displayName}!`);
      setCurrentUser(AuthService.getCurrentUser());
      // Clear form
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const user = await AuthService.signIn(email, password);
      setMessage(`✅ Signed in successfully! Welcome back, ${user.displayName}!`);
      setCurrentUser(AuthService.getCurrentUser());
      // Clear form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      setMessage('✅ Signed out successfully!');
      setCurrentUser(null);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  if (currentUser) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>🎉 You're Signed In!</h2>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            borderRadius: '8px',
            marginTop: '20px',
          }}
        >
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>Display Name:</strong> {currentUser.displayName}</p>
          <p><strong>User ID:</strong> {currentUser.uid}</p>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Sign Out
        </button>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
          <h3>✅ Authentication Test Passed!</h3>
          <p>Your Firebase Authentication is working correctly. You can now:</p>
          <ul>
            <li>Check Firebase Console → Authentication → Users to see your account</li>
            <li>Check Firebase Console → Firestore Database → users collection to see your profile</li>
            <li>Sign out and sign back in to test the login flow</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px' }}>
      <h2>🔐 Create DM Account / Sign In</h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setMode('signup')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: mode === 'signup' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Sign Up
        </button>
        <button
          onClick={() => setMode('signin')}
          style={{
            padding: '10px 20px',
            backgroundColor: mode === 'signin' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      </div>

      <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn}>
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
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc',
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
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ccc',
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
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
            color: message.startsWith('✅') ? '#155724' : '#721c24',
            borderRadius: '8px',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Test Credentials:</strong></p>
        <ul>
          <li>Use any email (e.g., test@example.com)</li>
          <li>Password must be at least 6 characters</li>
          <li>Display name can be anything</li>
        </ul>
      </div>
    </div>
  );
}
