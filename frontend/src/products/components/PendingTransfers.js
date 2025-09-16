// frontend/src/products/components/PendingTransfers.js
import React, { useState } from 'react';
import { productsAPI } from '../api/productsApi';

const PendingTransfers = ({ transfers = [], onUpdate }) => {
  const [responding, setResponding] = useState(null);

  const handleResponse = async (transferId, accept) => {
    setResponding(transferId);
    try {
      let response;
      if (accept) {
        response = await productsAPI.acceptTransfer(transferId);
      } else {
        response = await productsAPI.rejectTransfer(transferId);
      }
      
      alert(accept ? "Передача принята!" : "Передача отклонена!");
      onUpdate?.();
    } catch (err) {
      console.error('Response failed:', err);
      alert('Ошибка при обработке передачи');
    } finally {
      setResponding(null);
    }
  };
  
  if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
    return null;
  }

  return (
    <div className="pending-transfers">
      <h3>Ожидающие передачи</h3>
      <div className="transfers-list">
        {transfers.map((transfer) => (
          <div key={transfer.id} className="transfer-item">
            <div className="transfer-info">
              <strong>{transfer.product?.name || 'Неизвестный товар'}</strong> от {transfer.fromUserId}
              <br />
              Дата: {new Date(transfer.transferDate).toLocaleDateString()}
              {transfer.message && <div className="transfer-message">{transfer.message}</div>}
            </div>
            <div className="transfer-actions">
              <button
                onClick={() => handleResponse(transfer.id, true)}
                disabled={responding === transfer.id}
                className="accept-btn"
              >
                {responding === transfer.id ? '...' : 'Принять'}
              </button>
              <button
                onClick={() => handleResponse(transfer.id, false)}
                disabled={responding === transfer.id}
                className="reject-btn"
              >
                {responding === transfer.id ? '...' : 'Отклонить'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingTransfers;