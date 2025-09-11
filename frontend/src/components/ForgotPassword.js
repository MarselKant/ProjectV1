import React, { useState } from 'react';

const ForgotPassword = ({ onBackToLogin }) => {
  const [emailOrLogin, setEmailOrLogin] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('EmailOrLogin', emailOrLogin);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

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
    <div>
      <h2>Восстановление пароля</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Введите email или логин"
            value={emailOrLogin}
            onChange={(e) => setEmailOrLogin(e.target.value)}
            required
          />
        </div>
        
        {message && (
          <div className={message.includes('Ошибка') ? "error" : "success"}>
            {message}
          </div>
        )}
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Отправка...' : 'Восстановить пароль'}
        </button>
      </form>
      
      <button 
        type="button" 
        className="link-button" 
        onClick={onBackToLogin}
      >
        ← Назад к входу
      </button>
    </div>
  );
};

export default ForgotPassword;