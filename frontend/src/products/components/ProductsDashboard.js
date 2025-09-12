// frontend/src/products/components/ProductsDashboard.js
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
  const [userId, setUserId] = useState('user2'); // Временное значение

  useEffect(() => {
    console.log('Initializing ProductsDashboard');
    console.log('Access token:', localStorage.getItem('accessToken'));
    
    fetchProducts();
    fetchPendingTransfers();
  }, []);

  const fetchPendingTransfers = async () => {
    try {
      console.log('Fetching pending transfers for user:', userId);
      const response = await productsAPI.getPendingTransfers(userId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const transfers = await response.json();
      console.log('Pending transfers:', transfers);
      setPendingTransfers(transfers || []);
    } catch (err) {
      console.error('Error fetching pending transfers:', err);
      setPendingTransfers([]);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchProducts(newFilters);
  };

  const handlePageChange = (newPage) => {
    fetchProducts({ ...filters, page: newPage });
  };

  const handlePageSizeChange = (newSize) => {
    fetchProducts({ ...filters, pageSize: newSize, page: 1 });
  };

  const handleTransferSuccess = () => {
    fetchProducts();
    fetchPendingTransfers();
  };

  if (loading && products.length === 0) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="products-dashboard">
      <h1>Управление товарами</h1>
      
      <PendingTransfers 
        transfers={pendingTransfers} 
        onUpdate={fetchPendingTransfers}
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
      />
    </div>
  );
};

export default ProductsDashboard;