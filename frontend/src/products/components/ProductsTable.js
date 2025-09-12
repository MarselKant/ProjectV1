// frontend/src/products/components/ProductsTable.js
import React, { useState } from 'react';
import ProductModal from './ProductModal';
import TransferModal from './TransferModal';

const ProductsTable = ({ 
  products, 
  loading, 
  pagination, 
  onPageChange, 
  onPageSizeChange, 
  onTransferSuccess 
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProduct, setTransferProduct] = useState(null);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleTransferClick = (product, e) => {
    e.stopPropagation();
    setTransferProduct(product);
    setShowTransferModal(true);
  };

  const handleTransferComplete = () => {
    setShowTransferModal(false);
    setTransferProduct(null);
    onTransferSuccess?.();
  };

  const truncateDescription = (description, maxLength = 50) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

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
          </select>
        </div>
        
        <div className="page-info">
          Страница {pagination.page} из {totalPages || 1}
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
              <th>В наличии</th>
              <th>Действия</th>
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
                <td>{product.count_in_stock}</td>
                <td>
                  <button 
                    className="transfer-btn"
                    onClick={(e) => handleTransferClick(product, e)}
                    disabled={product.count_in_stock === 0}
                  >
                    Передать
                  </button>
                </td>
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
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Назад
        </button>
        
        <span>Страница {pagination.page} из {totalPages || 1}</span>
        
        <button 
          disabled={pagination.page >= totalPages} 
          onClick={() => onPageChange(pagination.page + 1)}
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

      {showTransferModal && (
        <TransferModal 
          product={transferProduct}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferComplete}
        />
      )}
    </div>
  );
};

export default ProductsTable;