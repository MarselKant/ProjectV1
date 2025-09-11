import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import ForgotPassword from './components/ForgotPassword';
import './styles/styles.css';

function App() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="app">
      <h1>Самый лучший сайт!</h1>
      {showForgotPassword ? (
        <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />
      ) : (
        <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
      )}
    </div>
  );
}

export default App;