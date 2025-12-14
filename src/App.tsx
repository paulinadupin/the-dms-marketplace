import { FirebaseTest } from './components/FirebaseTest';
import { AuthTest } from './components/AuthTest';

function App() {
  return (
    <div>
      <FirebaseTest />
      <hr style={{ margin: '40px 0', border: '2px solid #ccc' }} />
      <AuthTest />
    </div>
  );
}

export default App
