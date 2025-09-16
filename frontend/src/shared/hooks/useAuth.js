// frontend/src/shared/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authAPI } from '../api/apiClient';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const validateAuth = async () => {
      if (token) {
        try {
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
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

      console.log('Login response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Login response data:', data);
        
        if (data.accessToken && data.refreshToken) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          setIsAuthenticated(true);
          return { success: true };
        } else {
          console.error('Tokens not found in response:', data);
          return { 
            success: false, 
            error: 'Токены не получены от сервера' 
          };
        }
      } else {
        let errorText = 'Ошибка авторизации';
        
        try {
          errorText = await response.text();
        } catch (e) {
          console.error('Error reading response text:', e);
        }
        
        console.error('Login failed:', response.status, errorText);
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
    setIsAuthenticated(false);
    setUser(null);
  };

  return { isAuthenticated, user, loading, login, logout };
};