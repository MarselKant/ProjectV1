import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api/productsApi';

const TransferModal = ({ product, onClose, onSuccess, currentUser }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const timer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query) => {
    setSearchLoading(true);
    try {
      const usersData = await productsAPI.searchUsers(query);
      const filteredUsers = usersData.filter(user => user.id !== currentUser.id);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      setUsers([]);
    } finally {
      setSearchLoading(false);
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

    if (parseInt(selectedUserId) === currentUser.id) {
      setError('Нельзя передать товар самому себе');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await productsAPI.transferProduct({
        productId: product.id,
        fromUserId: currentUser.id,
        toUserId: parseInt(selectedUserId),
        quantity: quantity
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка при передаче товара');
      }

      alert(`Запрос на передачу товара "${product.name}" успешно отправлен!`);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Ошибка при передаче товара');
      console.error('Transfer error:', err);
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
            <p><strong>Доступно для передачи:</strong> {product.countInStock} шт.</p>
            <p><strong>Текущий владелец:</strong> {currentUser.login} (ID: {currentUser.id})</p>
            <p><strong>Цена:</strong> {product.price} ₽</p>
          </div>

          <div className="form-group">
            <label>Количество для передачи:</label>
            <input
              type="number"
              min="1"
              max={product.countInStock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="form-group">
            <label>Поиск пользователя:</label>
            <input
              type="text"
              placeholder="Введите логин пользователя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searchLoading}
            />
            {searchLoading && <div className="loading-small">Поиск...</div>}
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
                    {user.login} ({user.email}) - ID: {user.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {users.length === 0 && searchQuery.length > 1 && !searchLoading && (
            <div className="no-users">Пользователи не найдены</div>
          )}

          {selectedUserId && (
            <div className="selected-user">
              <strong>Выбран пользователь:</strong> {
                users.find(u => u.id == selectedUserId)?.login || `ID: ${selectedUserId}`
              }
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} disabled={loading}>Отмена</button>
          <button 
            onClick={handleTransfer} 
            disabled={loading || !selectedUserId || searchLoading}
            className="primary-btn"
          >
            {loading ? 'Передача...' : 'Передать товар'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;