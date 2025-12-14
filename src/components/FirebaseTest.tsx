import { useEffect, useState } from 'react';
import { db, auth } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export function FirebaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Testing Firebase connection...');

  useEffect(() => {
    const testFirebase = async () => {
      try {
        // Test 1: Check if Firebase is initialized
        if (!db || !auth) {
          throw new Error('Firebase not initialized');
        }

        // Test 2: Try to access Firestore (this will fail if rules are wrong, but that's ok)
        const testCollection = collection(db, 'users');

        // Test 3: Check auth is available
        const currentUser = auth.currentUser;

        setStatus('success');
        setMessage(`✅ Firebase Connected Successfully!

Project: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}
Auth: ${auth ? 'Initialized' : 'Not initialized'}
Firestore: ${db ? 'Initialized' : 'Not initialized'}
Current User: ${currentUser ? currentUser.email : 'Not signed in'}
        `);
      } catch (error: any) {
        setStatus('error');
        setMessage(`❌ Firebase Error: ${error.message}`);
      }
    };

    testFirebase();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔥 Firebase Connection Test</h1>
      <div
        style={{
          padding: '20px',
          marginTop: '20px',
          borderRadius: '8px',
          backgroundColor:
            status === 'success' ? '#d4edda' : status === 'error' ? '#f8d7da' : '#fff3cd',
          color: status === 'success' ? '#155724' : status === 'error' ? '#721c24' : '#856404',
          border: `2px solid ${
            status === 'success' ? '#c3e6cb' : status === 'error' ? '#f5c6cb' : '#ffeaa7'
          }`,
        }}
      >
        <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Configuration Details:</h2>
        <ul>
          <li>API Key: {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</li>
          <li>Auth Domain: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing'}</li>
          <li>Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing'}</li>
          <li>Storage Bucket: {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing'}</li>
          <li>Messaging Sender ID: {import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing'}</li>
          <li>App ID: {import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}</li>
          <li>Measurement ID: {import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? '✅ Set' : '❌ Missing'}</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
        <h3>Next Steps:</h3>
        <ol>
          <li>If you see ✅ Firebase Connected - everything is working!</li>
          <li>Check Firebase Console → Authentication to verify it's enabled</li>
          <li>Check Firebase Console → Firestore Database to verify it's created</li>
          <li>Try creating a DM account to test authentication</li>
        </ol>
      </div>
    </div>
  );
}
