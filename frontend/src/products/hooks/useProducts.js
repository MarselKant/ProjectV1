import { useState, useCallback } from 'react';
import { productsAPI } from '../api/productsApi';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
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
        maxPrice: filters.maxPrice || ''
      };

      // Убираем пустые параметры
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await productsAPI.getProducts(params);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка загрузки: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data) {
        setProducts(data.items || []);
        setPagination({
          page: data.pageNumber || 1,
          pageSize: data.pageSize || pagination.pageSize,
          total: data.totalCount || 0,
          totalPages: data.totalPages || 1
        });
      } else {
        setProducts([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          totalPages: 1
        }));
      }
    } catch (err) {
      setError(err.message);
      setProducts([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 1
      }));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  const updatePageSize = useCallback((newPageSize) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1
    }));
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    updatePageSize
  };
};