// frontend/src/auth/components/ForgotPassword.js
import React, { useState } from 'react';
import { authAPI } from '../../shared/api/apiClient';

const ForgotPassword = ({ onBackToLogin }) => {
  const [emailOrLogin, setEmailOrLogin] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await authAPI.forgotPassword(emailOrLogin);

      if (response.ok) {
        const data = await response.json();
        setMessage(data.Message || `Инструкции отправлены на ${emailOrLogin}`);
      } else if (response.status === 402) {
        setMessage('Пользователь с таким email/логином не найден');
      } else {
        setMessage('Ошибка отправки запроса');
      }
    } catch (error) {
      setMessage('Ошибка сети. Проверьте подключение к бэкенду.');
      console.error('Network error:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="forgot-password">
      <h2>Восстановление пароля</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Введите email или логин"
            value={emailOrLogin}
            onChange={(e) => setEmailOrLogin(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        {message && (
          <div className={message.includes('Ошибка') ? "error-message" : "success-message"}>
            {message}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="auth-button"
        >
          {isLoading ? 'Отправка...' : 'Восстановить пароль'}
        </button>
      </form>
      
      <button 
        type="button" 
        className="link-button" 
        onClick={onBackToLogin}
        disabled={isLoading}
      >
        ← Назад к входу
      </button>
    </div>
  );
};

export default ForgotPassword;