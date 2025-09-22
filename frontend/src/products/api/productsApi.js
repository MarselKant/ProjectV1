const PRODUCT_API_BASE = process.env.REACT_APP_PRODUCT_API || 'http://localhost:7224';

export const productsAPI = {
  getProducts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    
    return fetch(`${PRODUCT_API_BASE}/api/products?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    });
  },

  transferProduct: async (transferData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${PRODUCT_API_BASE}/api/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromUserId: transferData.fromUserId,
          toUserId: transferData.toUserId,
          items: transferData.items
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Transfer failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Transfer API error:', error);
      throw error;
    }
  },

  searchUsers: async (query) => {
    try {
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