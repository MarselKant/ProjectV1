const PRODUCT_API_BASE = process.env.REACT_APP_PRODUCT_API || 'http://localhost:7224';

export const productsAPI = {
  getProducts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.minStock) queryParams.append('minStock', params.minStock);

    const url = `${PRODUCT_API_BASE}/api/products?${queryParams.toString()}`;
    console.log('API Request:', url);
    
    return fetch(url, {
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
        'Content-Type': 'application/json'
      }
    });
  },

  rejectTransfer: (transferId) => {
    return fetch(`${PRODUCT_API_BASE}/api/transfer/reject/${transferId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
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
    return fetch(`${PRODUCT_API_BASE}/api/transfer/users?search=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      }
    }).then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    });
  }
};