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
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} 
                   onError={(e) => {
                     e.target.style.display = 'none';
                     e.target.nextSibling.style.display = 'block';
                   }} />
            ) : null}
            <div className="no-image" style={{display: product.imageUrl ? 'none' : 'block'}}>
              Изображение отсутствует
            </div>
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
              <strong>В наличии:</strong> {product.countInStock} шт.
            </div>
            <div className="detail-row">
              <strong>Владелец:</strong> {product.userId || 'Неизвестно'}
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