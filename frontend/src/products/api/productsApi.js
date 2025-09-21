const PRODUCT_API_BASE = process.env.REACT_APP_PRODUCT_API || 'http://localhost:7224';

export const productsAPI = {
  getProducts: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return fetch(`${PRODUCT_API_BASE}/api/products?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  getPendingTransfers: (userId) => {
    return fetch(`${PRODUCT_API_BASE}/api/transfer/pending/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  acceptTransfer: (transferId) => {
    return fetch(`${PRODUCT_API_BASE}/api/transfer/accept/${transferId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  rejectTransfer: (transferId) => {
    return fetch(`${PRODUCT_API_BASE}/api/transfer/reject/${transferId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  transferProduct: (transferData) => {
    return fetch(`${PRODUCT_API_BASE}/api/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(transferData)
    });
  },

  searchUsers: async (query) => {
    try {
      // Моковые данные пользователей для поиска
      const mockUsers = [
        { id: 1, login: 'root', email: 'root@example.com' },
        { id: 2, login: 'asd', email: 'asd@example.com' },
        { id: 3, login: 'user3', email: 'user3@example.com' },
        { id: 4, login: 'test', email: 'test@example.com' }
      ];
      
      const filteredUsers = mockUsers.filter(user => 
        user.login.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      
      return filteredUsers;
    } catch (err) {
      console.error('Search users error:', err);
      return [];
    }
  }
};