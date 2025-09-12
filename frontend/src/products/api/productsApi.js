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

  searchUsers: (query) => {
    const mockUsers = [
      { id: 'user1', login: 'user1', email: 'user1@example.com' },
      { id: 'user2', login: 'user2', email: 'user2@example.com' },
      { id: 'user3', login: 'user3', email: 'user3@example.com' },
      { id: 'admin', login: 'admin', email: 'admin@example.com' }
    ];
    
    const filteredUsers = mockUsers.filter(user => 
      user.login.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    
    return Promise.resolve(filteredUsers);
  }
};