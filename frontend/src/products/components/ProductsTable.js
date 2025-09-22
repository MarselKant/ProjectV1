import React, { useState } from 'react';
import ProductModal from './ProductModal';

const ProductsTable = ({ 
  products, 
  loading, 
  pagination, 
  onPageChange, 
  onPageSizeChange 
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const truncateDescription = (description, maxLength = 50) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const totalPages = pagination.totalPages || 1;

  return (
    <div className="products-table-container">
      <div className="table-controls">
        <div className="pagination-controls">
          <span>Товаров на странице: </span>
          <select 
            value={pagination.pageSize} 
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        
        <div className="page-info">
          Страница {pagination.page} из {totalPages}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Описание</th>
              <th>Цена</th>
              <th>Офис</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr 
                key={product.id} 
                className="product-row"
                onClick={() => handleProductClick(product)}
              >
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{truncateDescription(product.description)}</td>
                <td>{product.price} ₽</td>
                <td>{product.office || 'Не указан'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && !loading && (
        <div className="no-products">Товары не найдены</div>
      )}

      {loading && <div className="loading">Загрузка...</div>}

      <div className="pagination">
        <button 
          disabled={pagination.page <= 1} 
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        >
          Назад
        </button>
        
        <span>Страница {pagination.page} из {totalPages}</span>
        
        <button 
          disabled={pagination.page >= totalPages} 
          onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
        >
          Вперед
        </button>
      </div>

      {showProductModal && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setShowProductModal(false)}
        />
      )}
    </div>
  );
};

export default ProductsTable;