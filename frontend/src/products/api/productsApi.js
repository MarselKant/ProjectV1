// frontend/src/products/api/productsApi.js
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

  // Исправленные endpoints
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
  }
};