// frontend/src/products/components/ProductModal.js
import React from 'react';

const ProductModal = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="product-image">
            {product.img ? (
              <img src={product.img} alt={product.name} />
            ) : (
              <div className="no-image">Изображение отсутствует</div>
            )}
          </div>
          
          <div className="product-details">
            <div className="detail-row">
              <strong>ID:</strong> {product.id}
            </div>
            <div className="detail-row">
              <strong>Описание:</strong> {product.description}
            </div>
            <div className="detail-row">
              <strong>Цена:</strong> {product.price} ₽
            </div>
            <div className="detail-row">
              <strong>В наличии:</strong> {product.count_in_stock} шт.
            </div>
            <div className="detail-row">
              <strong>Владелец:</strong> {product.user?.name || 'Неизвестно'}
            </div>
            <div className="detail-row">
              <strong>Офис:</strong> {product.office || 'Не указан'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;