// frontend/src/auth/components/AuthService.js
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import ForgotPassword from './ForgotPassword';
import '../styles/auth.css';

const AuthService = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <div className="auth-service">
      <div className="auth-container">
        <h1>WELCOME Avito 2.0</h1>
        {showForgotPassword ? (
          <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />
        ) : (
          <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthService;