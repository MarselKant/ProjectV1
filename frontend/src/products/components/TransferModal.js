// frontend/src/products/components/TransferModal.js
import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api/productsApi';

const TransferModal = ({ product, onClose, onSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers(searchQuery);
    }
  }, [searchQuery]);

  const searchUsers = async (query) => {
    try {
      const usersData = await productsAPI.searchUsers(query);
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUserId || quantity <= 0) {
      setError('Выберите пользователя и укажите количество');
      return;
    }

    if (quantity > product.countInStock) {
      setError('Недостаточно товара на складе');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Получаем текущего пользователя из localStorage или используем дефолтного
      const currentUserId = 'user2'; // В реальном приложении нужно получать из токена
      
      await productsAPI.transferProduct({
        productId: product.id,
        fromUserId: currentUserId,
        toUserId: selectedUserId,
        quantity: quantity
      });
      
      alert(`Запрос на передачу товара "${product.name}" успешно отправлен!`);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Ошибка при передаче товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transfer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Передача товара: {product.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="transfer-info">
            <p>Доступно для передачи: {product.countInStock} шт.</p>
            <p>Текущий владелец: {product.userId || 'Неизвестно'}</p>
          </div>

          <div className="form-group">
            <label>Количество:</label>
            <input
              type="number"
              min="1"
              max={product.countInStock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>Поиск пользователя:</label>
            <input
              type="text"
              placeholder="Введите имя или email пользователя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {users.length > 0 && (
            <div className="form-group">
              <label>Выберите пользователя:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Выберите пользователя --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.login} ({user.email || 'без email'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedUserId && (
            <div className="selected-user">
              <strong>Выбран пользователь ID:</strong> {selectedUserId}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Отмена</button>
          <button 
            onClick={handleTransfer} 
            disabled={loading || !selectedUserId}
          >
            {loading ? 'Передача...' : 'Передать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;