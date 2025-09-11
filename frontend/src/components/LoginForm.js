import React, { useState } from 'react';

const LoginForm = ({ onForgotPassword }) => {
  const [formData, setFormData] = useState({ Login: '', Password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const formDataToSend = new FormData();
      formDataToSend.append('Login', formData.Login);
      formDataToSend.append('Password', formData.Password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('Response status:', response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('Полный ответ сервера:', JSON.stringify(data, null, 2));
        
        if (data.accessToken && data.refreshToken) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          alert('Успешный вход! Токены сохранены.');
          console.log('Access Token:', data.accessToken);
          console.log('Refresh Token:', data.refreshToken);
        } else {
          console.error('Токены не найдены в ответе:', data);
          setError('Ошибка: токены не получены от сервера');
        }
        
      } else if (response.status === 401) {
        setError('Неверный логин или пароль');
      } else if (response.status === 403) {
        setError('Заполните все поля');
      } else {
        setError(`Ошибка сервера: ${response.status}`);
      }

    } catch (error) {
      console.error('Full error:', error);
      setError('Ошибка сети. Убедитесь, что бэкенд запущен');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          name="Login"
          placeholder="Логин"
          value={formData.Login}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div>
        <input
          type="password"
          name="Password"
          placeholder="Пароль"
          value={formData.Password}
          onChange={handleInputChange}
          required
        />
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
      
      <button 
        type="button" 
        className="link-button" 
        onClick={onForgotPassword}
      >
        Забыли пароль?
      </button>
    </form>
  );
};

export default LoginForm;