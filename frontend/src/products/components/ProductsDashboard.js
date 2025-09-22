import React, { useState, useEffect } from 'react';
import ProductsTable from './ProductsTable';
import PendingTransfers from './PendingTransfers';
import TransferHistory from './TransferHistory';
import InventoryTable from './InventoryTable';
import Filters from './Filters';
import { useProducts } from '../hooks/useProducts';
import '../styles/products.css';

const ProductsDashboard = () => {
  const { products, loading, error, pagination, fetchProducts, updatePageSize } = useProducts();
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: ''
  });
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        fetchProducts();
        fetchPendingTransfers(user.id);
        fetchTransferHistory(user.id);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [refreshKey]);

  const fetchPendingTransfers = async (userId) => {
    try {
      const response = await fetch(`http://localhost:7224/api/transfer/pending/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingTransfers(data);
      } else {
        setPendingTransfers([]);
      }
    } catch (error) {
      setPendingTransfers([]);
    }
  };

  const fetchTransferHistory = async (userId) => {
    try {
      const response = await fetch(`http://localhost:7224/api/transfer/history/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransferHistory(data);
      } else {
        setTransferHistory([]);
      }
    } catch (error) {
      setTransferHistory([]);
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
    updatePageSize(newSize);
    fetchProducts({ ...filters, pageSize: newSize, page: 1 });
  };

  const handleTransferSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTransferResponse = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading && products.length === 0) {
    return <div className="loading">Загрузка товаров...</div>;
  }

  return (
    <div className="products-dashboard">
      <h1>Управление товарами</h1>
      
      {currentUser && (
        <div className="user-info">
          Текущий пользователь: {currentUser.login} (ID: {currentUser.id})
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="main-content">
          <PendingTransfers 
            transfers={pendingTransfers} 
            onUpdate={handleTransferResponse}
            currentUser={currentUser}
          />
          
          <InventoryTable 
            currentUser={currentUser} 
            onTransferSuccess={handleTransferSuccess}
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
          />
        </div>
        
        <div className="sidebar">
          <TransferHistory 
            history={transferHistory}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductsDashboard;