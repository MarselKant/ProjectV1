// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import AuthService from './auth/components/AuthService';
import ProductsDashboard from './products/components/ProductsDashboard';
import { useAuth } from './shared/hooks/useAuth';
import './styles/main.css';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (appLoading) {
    return <div className="loading">Загрузка приложения...</div>;
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <div>
          <div className="header">
            <h1>Самый лучший сайт!</h1>
            <button onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.reload();
            }} className="logout-btn">
              Выйти
            </button>
          </div>
          <ProductsDashboard />
        </div>
      ) : (
        <AuthService />
      )}
    </div>
  );
}

export default App;