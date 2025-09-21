import React, { useState, useEffect } from 'react';
import ProductsTable from './ProductsTable';
import PendingTransfers from './PendingTransfers';
import Filters from './Filters';
import { useProducts } from '../hooks/useProducts';
import { productsAPI } from '../api/productsApi';
import '../styles/products.css';

const ProductsDashboard = () => {
  const { products, loading, error, pagination, fetchProducts } = useProducts();
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    minStock: ''
  });
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    console.log('Initializing ProductsDashboard');
    
    const getUserFromToken = () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const username = payload.unique_name;
          
          const userMap = {
            'root': { id: 1, login: 'root' },
            'asd': { id: 2, login: 'asd' }
          };
          
          return userMap[username] || { id: 1, login: 'root' };
        }
      } catch (error) {
        console.error('Error getting user from token:', error);
      }
      return null;
    };

    const user = getUserFromToken();
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('Current user:', user);
      fetchProducts();
      fetchPendingTransfers(user.id);
    }
  }, []);

  const fetchPendingTransfers = async (userId) => {
    try {
      console.log('Fetching pending transfers for user ID:', userId);
      const response = await productsAPI.getPendingTransfers(userId);
      
      if (!response.ok) {
        if (response.status === 400) {
          console.warn('No pending transfers found for user');
          setPendingTransfers([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const transfers = await response.json();
      console.log('Pending transfers received:', transfers);
      setPendingTransfers(Array.isArray(transfers) ? transfers : []);
    } catch (err) {
      console.error('Error fetching pending transfers:', err);
      setPendingTransfers([]);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchProducts({ ...newFilters, page: 1 });
  };

  const handlePageChange = (newPage) => {
    fetchProducts({ ...filters, page: newPage });
  };

  const handlePageSizeChange = (newSize) => {
    fetchProducts({ ...filters, pageSize: newSize, page: 1 });
  };

  const handleTransferSuccess = () => {
    fetchProducts();
    if (currentUser) {
      fetchPendingTransfers(currentUser.id);
    }
    alert('Товар успешно передан!');
  };

  if (loading && products.length === 0) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="products-dashboard">
      <h1>Управление товарами</h1>
      
      {currentUser && (
        <div className="user-info">
          Текущий пользователь: {currentUser.login} (ID: {currentUser.id})
        </div>
      )}
      
      <PendingTransfers 
        transfers={pendingTransfers} 
        onUpdate={() => currentUser && fetchPendingTransfers(currentUser.id)}
      />
      
      <Filters 
        filters={filters} 
        onChange={handleFilterChange} 
      />
      
      {error && <div className="error-message">{error}</div>}
      
      <ProductsTable 
        products={products}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onTransferSuccess={handleTransferSuccess}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ProductsDashboard;