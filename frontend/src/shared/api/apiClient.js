// frontend/src/shared/api/apiClient.js

// Для разработки используем прямые URL, для продакшена - относительные пути через nginx
const getAuthApiBase = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api/auth';
  }
  return process.env.REACT_APP_AUTH_API || 'http://localhost:7223';
};

const getProductApiBase = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api/products';
  }
  return process.env.REACT_APP_PRODUCT_API || 'http://localhost:7224';
};

const AUTH_API_BASE = getAuthApiBase();
const PRODUCT_API_BASE = getProductApiBase();

export const authAPI = {
  login: async (loginData) => {
    const formData = new FormData();
    formData.append('Login', loginData.Login);
    formData.append('Password', loginData.Password);

    const response = await fetch(`${AUTH_API_BASE}/login`, {
      method: 'POST',
      body: formData,
      credentials: process.env.NODE_ENV === 'production' ? 'same-origin' : 'include'
    });

    return response;
  },

  forgotPassword: async (emailOrLogin) => {
    const formData = new FormData();
    formData.append('EmailOrLogin', emailOrLogin);
    
    const response = await fetch(`${AUTH_API_BASE}/forgot-password`, {
      method: 'POST',
      body: formData,
      credentials: process.env.NODE_ENV === 'production' ? 'same-origin' : 'include'
    });

    return response;
  },

  refreshToken: async (refreshToken) => {
    const formData = new FormData();
    formData.append('RefreshToken', refreshToken);
    
    const response = await fetch(`${AUTH_API_BASE}/refresh`, {
      method: 'POST',
      body: formData,
      credentials: process.env.NODE_ENV === 'production' ? 'same-origin' : 'include'
    });

    return response;
  }
};

export const productsAPI = {
  getProducts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Правильные имена параметров согласно бэкенду
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.minStock) queryParams.append('minStock', params.minStock);
    if (params.page) queryParams.append('pageNumber', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    
    return fetch(`${PRODUCT_API_BASE}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  getProduct: (productId) => {
    return fetch(`${PRODUCT_API_BASE}/${productId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  getUserProducts: (userId) => {
    return fetch(`${PRODUCT_API_BASE}/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  transferProduct: (transferData) => {
    return fetch(`http://localhost:7224/api/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(transferData)
    });
  },

  getPendingTransfers: (userId) => {
    return fetch(`http://localhost:7224/api/transfer/pending/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  acceptTransfer: (transferId) => {
    return fetch(`http://localhost:7224/api/transfer/accept/${transferId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  rejectTransfer: (transferId) => {
    return fetch(`http://localhost:7224/api/transfer/reject/${transferId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  }
};