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
    const searchUsers = async () => {
      if (searchQuery.length > 1) {
        setSearchLoading(true);
        try {
          const usersData = await productsAPI.searchUsers(searchQuery);
          const filteredUsers = usersData.filter(user => user.id !== currentUser.id);
          setUsers(filteredUsers);
        } catch (err) {
          console.error('Error searching users:', err);
          setUsers([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setUsers([]);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser.id]);

  const handleTransfer = async () => {
    if (!selectedUserId || quantity <= 0) {
      setError('Выберите пользователя и укажите количество');
      alert('Пожалуйста, выберите пользователя и укажите количество');
      return;
    }

    if (quantity > product.countInStock) {
      setError('Недостаточно товара на складе');
      alert(`Недостаточно товара на складе. Доступно: ${product.countInStock} шт.`);
      return;
    }

    if (parseInt(selectedUserId) === currentUser.id) {
      setError('Нельзя передать товар самому себе');
      alert('Нельзя передать товар самому себе');
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при передаче товара');
      }

      alert(`Запрос на передачу товара "${product.name}" успешно отправлен!`);
      onSuccess();
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.message || 'Ошибка при передаче товара');
      alert('Ошибка при передаче товара: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= product.countInStock) {
      setQuantity(numValue);
    } else if (numValue > product.countInStock) {
      setQuantity(product.countInStock);
      alert(`Максимальное количество: ${product.countInStock} шт.`);
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
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={(e) => {
                if (e.target.value === '' || parseInt(e.target.value) < 1) {
                  setQuantity(1);
                  alert('Количество должно быть не менее 1');
                }
              }}
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
          <button onClick={onClose} disabled={loading} className="secondary-btn">
            Отмена
          </button>
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