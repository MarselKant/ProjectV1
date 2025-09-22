// frontend/src/shared/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authAPI } from '../api/apiClient';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('currentUser');
      
      if (token && storedUser) {
        try {
          setIsAuthenticated(true);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('currentUser');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    validateAuth();
  }, []);

  const login = async (loginData) => {
    try {
      const response = await authAPI.login(loginData);

      if (response.ok) {
        const data = await response.json();
        
        if (data.accessToken && data.refreshToken) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Определяем пользователя по логину
          const userMap = {
            'root': { id: 1, login: 'root', email: 'root@example.com' },
            'asd': { id: 2, login: 'asd', email: 'asd@example.com' }
          };
          
          const user = userMap[loginData.Login] || { id: 1, login: loginData.Login };
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          setIsAuthenticated(true);
          setUser(user);
          return { success: true };
        } else {
          return { 
            success: false, 
            error: 'Токены не получены от сервера' 
          };
        }
      } else {
        const errorText = await response.text();
        return { 
          success: false, 
          error: response.status === 401 ? 'Неверный логин или пароль' : errorText
        };
      }
    } catch (error) {
      console.error('Login network error:', error);
      return { 
        success: false, 
        error: 'Ошибка сети. Проверьте подключение к серверу.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setUser(null);
  };

  return { isAuthenticated, user, loading, login, logout };
};