// frontend/src/products/components/PendingTransfers.js
import React, { useState } from 'react';

const PendingTransfers = ({ transfers = [], onUpdate, currentUser }) => {
  const [responding, setResponding] = useState(null);

  const handleResponse = async (transferId, accept) => {
    setResponding(transferId);
    try {
      const url = accept 
        ? `http://localhost:7224/api/transfer/accept/${transferId}`
        : `http://localhost:7224/api/transfer/reject/${transferId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      if (response.ok) {
        alert(accept ? "✅ Предложение принято!" : "❌ Предложение отклонено.");
        onUpdate(); // Обновляем данные
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Ошибка при обработке предложения');
      }
    } catch (err) {
      console.error('Response failed:', err);
      alert('Ошибка при обработке предложения');
    } finally {
      setResponding(null);
    }
  };

  if (!currentUser || !Array.isArray(transfers) || transfers.length === 0) {
    return null;
  }

  return (
    <div className="pending-transfers">
      <h3>📦 Ожидающие передачи</h3>
      <div className="transfers-list">
        {transfers.map((transfer) => {
          const isSender = transfer.fromUserId === currentUser.id;
          const isReceiver = transfer.toUserId === currentUser.id;
          
          return (
            <div key={transfer.id} className="transfer-item">
              <div className="transfer-info">
                <strong>Передача #{transfer.id}</strong>
                <br />
                <span className="transfer-from">
                  {isSender ? 
                    `Вы → Пользователь ${transfer.toUserId}` :
                    `Пользователь ${transfer.fromUserId} → Вам`
                  }
                </span>
                <br />
                <span className="transfer-date">
                  Дата: {new Date(transfer.transferDate).toLocaleDateString('ru-RU')}
                </span>
                <div className="transfer-items">
                  {transfer.items && transfer.items.map((item, index) => (
                    <div key={index} className="transfer-item-detail">
                      {item.productName} - {item.quantity} шт.
                    </div>
                  ))}
                </div>
              </div>
              <div className="transfer-actions">
                {isSender ? (
                  <button
                    onClick={() => handleResponse(transfer.id, false)}
                    disabled={responding === transfer.id}
                    className="reject-btn"
                    title="Отменить передачу"
                  >
                    {responding === transfer.id ? '...' : '❌ Отменить'}
                  </button>
                ) : isReceiver ? (
                  <>
                    <button
                      onClick={() => handleResponse(transfer.id, true)}
                      disabled={responding === transfer.id}
                      className="accept-btn"
                      title="Принять передачу"
                    >
                      {responding === transfer.id ? '...' : '✅ Принять'}
                    </button>
                    <button
                      onClick={() => handleResponse(transfer.id, false)}
                      disabled={responding === transfer.id}
                      className="reject-btn"
                      title="Отклонить передачу"
                    >
                      {responding === transfer.id ? '...' : '❌ Отклонить'}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingTransfers;