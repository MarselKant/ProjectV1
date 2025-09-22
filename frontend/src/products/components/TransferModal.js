import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api/productsApi';

const TransferModal = ({ products, onClose, onSuccess, currentUser }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const initialQuantities = {};
    products.forEach(product => {
      initialQuantities[product.productId || product.id] = 1;
    });
    setQuantities(initialQuantities);
  }, [products]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length > 0) {
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
    if (!selectedUserId) {
      setError('Выберите пользователя');
      alert('Пожалуйста, выберите пользователя');
      return;
    }

    if (parseInt(selectedUserId) === currentUser.id) {
      setError('Нельзя передать товар самому себе');
      alert('Нельзя передать товар самому себе');
      return;
    }

    for (const product of products) {
      const productId = product.productId || product.id;
      const quantity = quantities[productId] || 0;
      if (quantity <= 0) {
        setError(`Укажите количество для товара "${product.name}"`);
        alert(`Укажите количество для товара "${product.name}"`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const transferItems = products.map(product => ({
        productId: product.productId || product.id,
        quantity: quantities[product.productId || product.id] || 1
      }));

      const response = await fetch('http://localhost:7224/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: parseInt(selectedUserId),
          items: transferItems
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || '✅ Запрос на передачу товаров отправлен!');
        onSuccess();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || `Transfer failed with status ${response.status}`);
      }
    } catch (err) {
      console.error('Transfer error:', err);
      let errorMessage = 'Ошибка при передаче товаров';
      
      try {
        const errorData = JSON.parse(err.message);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      alert(`Ошибка: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setQuantities(prev => ({
        ...prev,
        [productId]: numValue
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transfer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Передача товаров</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="transfer-info">
            <p><strong>Текущий владелец:</strong> {currentUser.login} (ID: {currentUser.id})</p>
            <p><strong>Количество товаров:</strong> {products.length}</p>
          </div>

          <div className="transfer-products-list">
            <h4>Товары для передачи:</h4>
            {products.map(product => {
              const productId = product.productId || product.id;
              return (
                <div key={productId} className="transfer-product-item">
                  <div className="product-info">
                    <strong>{product.name}</strong>
                    <span>{product.price} ₽</span>
                  </div>
                  <div className="quantity-control">
                    <label>Количество:</label>
                    <input
                      type="number"
                      min="1"
                      max={product.countInStock || 10}
                      value={quantities[productId] || 1}
                      onChange={(e) => handleQuantityChange(productId, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
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

          {users.length === 0 && searchQuery.length > 0 && !searchLoading && (
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
            {loading ? 'Передача...' : 'Передать товары'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;