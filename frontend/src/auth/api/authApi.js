// frontend/src/auth/api/authApi.js
const AUTH_API_BASE = process.env.REACT_APP_AUTH_API || 'http://localhost:7223';

export const authApi = {
  // Логин
  login: (loginData) => {
    return fetch(`${AUTH_API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
  },

  // Восстановление пароля
  forgotPassword: (emailOrLogin) => {
    return fetch(`${AUTH_API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ EmailOrLogin: emailOrLogin }),
    });
  },

  // Обновление токена
  refreshToken: (refreshToken) => {
    return fetch(`${AUTH_API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ RefreshToken: refreshToken }),
    });
  }
};