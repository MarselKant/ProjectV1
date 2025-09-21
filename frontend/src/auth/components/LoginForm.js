import React, { useState } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';

const LoginForm = ({ onForgotPassword }) => {
  const [formData, setFormData] = useState({ Login: '', Password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData);
      
      if (!result.success) {
        setError(result.error || 'Ошибка авторизации');
        alert('Ошибка авторизации: ' + result.error);
      } else {
        alert('Вход выполнен успешно!');
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('Tokens saved:', { token, refreshToken });
        window.location.reload();
      }
    } catch (err) {
      console.error('Login form error:', err);
      setError('Произошла непредвиденная ошибка');
      alert('Ошибка сети. Проверьте подключение к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <input
          type="text"
          name="Login"
          placeholder="Логин"
          value={formData.Login}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="form-group">
        <input
          type="password"
          name="Password"
          placeholder="Пароль"
          value={formData.Password}
          onChange={handleInputChange}
          required
          disabled={isLoading}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        type="submit" 
        disabled={isLoading}
        className="auth-button"
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
      
      <button 
        type="button" 
        className="link-button" 
        onClick={onForgotPassword}
        disabled={isLoading}
      >
        Забыли пароль?
      </button>
    </form>
  );
};

export default LoginForm;