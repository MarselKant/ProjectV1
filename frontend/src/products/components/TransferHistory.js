import React from 'react';

const TransferHistory = ({ history = [], currentUser }) => {
  if (!currentUser || !Array.isArray(history) || history.length === 0) {
    return (
      <div className="transfer-history">
        <h3>📋 История передач</h3>
        <div className="no-history">История передач отсутствует</div>
      </div>
    );
  }

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Ожидание';
      case 1: return 'Принято';
      case 2: return 'Отклонено';
      default: return 'Неизвестно';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 0: return 'status-pending';
      case 1: return 'status-accepted';
      case 2: return 'status-rejected';
      default: return '';
    }
  };

  return (
    <div className="transfer-history">
      <h3>📋 История передач</h3>
      <div className="history-list">
        {history.map((item) => (
          <div key={item.id} className="history-item">
            <div className="history-header">
              <span className="transfer-id">#{item.transferId}</span>
              <span className={`status ${getStatusClass(item.status)}`}>
                {getStatusText(item.status)}
              </span>
            </div>
            <div className="history-details">
              <div>От: {item.fromUserId}</div>
              <div>Кому: {item.toUserId}</div>
              <div>Дата: {new Date(item.transferDate).toLocaleDateString('ru-RU')}</div>
              {item.message && (
                <div className="history-message">{item.message}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransferHistory;