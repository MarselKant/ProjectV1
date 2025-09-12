// frontend/src/products/hooks/useProducts.js
import { useState, useCallback } from 'react';
import { productsAPI } from '../api/productsApi';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });

  const fetchProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: filters.page || pagination.page,
        pageSize: filters.pageSize || pagination.pageSize,
        search: filters.search || '',
        minPrice: filters.minPrice || '',
        maxPrice: filters.maxPrice || '',
        minStock: filters.minStock || ''
      };

      console.log('Fetching products with params:', params);
      console.log('Token:', localStorage.getItem('accessToken'));

      const response = await productsAPI.getProducts(params);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Попробуем получить текст ошибки
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Products response:', data);
      
      if (data && data.items) {
        setProducts(data.items);
        setPagination({
          page: data.pageNumber || 1,
          pageSize: data.pageSize || 10,
          total: data.totalCount || 0
        });
      } else {
        setProducts([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Ошибка загрузки товаров: ' + err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  return {
    products,
    loading,
    error,
    pagination,
    fetchProducts
  };
};