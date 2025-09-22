// frontend/src/shared/api/apiClient.js
const AUTH_API_BASE = process.env.NODE_ENV === 'production' ? '/api/auth' : 'http://localhost:7223';
const PRODUCT_API_BASE = process.env.NODE_ENV === 'production' ? '/api/products' : 'http://localhost:7224';

export const authAPI = {
  login: async (loginData) => {
    const formData = new FormData();
    formData.append('Login', loginData.Login);
    formData.append('Password', loginData.Password);

    try {
      const response = await fetch(`${AUTH_API_BASE}/login`, {
        method: 'POST',
        body: formData,
      });

      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  forgotPassword: async (emailOrLogin) => {
    const formData = new FormData();
    formData.append('EmailOrLogin', emailOrLogin);
    
    try {
      const response = await fetch(`${AUTH_API_BASE}/forgot-password`, {
        method: 'POST',
        body: formData,
      });

      return response;
    } catch (error) {
      console.error('Forgot password API error:', error);
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    const formData = new FormData();
    formData.append('RefreshToken', refreshToken);
    
    try {
      const response = await fetch(`${AUTH_API_BASE}/refresh`, {
        method: 'POST',
        body: formData,
      });

      return response;
    } catch (error) {
      console.error('Refresh token API error:', error);
      throw error;
    }
  }
};

export const productsAPI = {
  getProducts: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
      if (params.page) queryParams.append('pageNumber', params.page);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${PRODUCT_API_BASE}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      return response;
    } catch (error) {
      console.error('Get products API error:', error);
      throw error;
    }
  },

  transferProduct: async (transferData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:7224/api/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromUserId: transferData.fromUserId,
          toUserId: transferData.toUserId,
          items: [{
            productId: transferData.productId,
            quantity: transferData.quantity
          }]
        })
      });

      return response;
    } catch (error) {
      console.error('Transfer product API error:', error);
      throw error;
    }
  },

  searchUsers: async (query) => {
    // Mock данные пользователей
    const mockUsers = [
      { id: 1, login: 'root', email: 'root@example.com' },
      { id: 2, login: 'asd', email: 'asd@example.com' },
      { id: 3, login: 'user3', email: 'user3@example.com' },
      { id: 4, login: 'test', email: 'test@example.com' }
    ];
    
    return mockUsers.filter(user => 
      user.login.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
  }
};