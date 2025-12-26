import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import Login from './components/Login';
import { api, fetchCsrfToken } from './utils/api';
import { useTheme } from './utils/useTheme';

const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  console.log('Murder v2.0.0 - Roleplay Platform');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useTheme(); // Initialize theme on app load

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Fetch CSRF token first
    await fetchCsrfToken();
    // Then check authentication
    await checkAuth();
  };

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={checkAuth} />}
        />
        <Route
          path="/*"
          element={user ? (
            <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
              <Dashboard user={user} onLogout={() => setUser(null)} />
            </Suspense>
          ) : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
