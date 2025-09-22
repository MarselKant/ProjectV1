import React, { useState } from 'react';
import TransferModal from './TransferModal';

const InventoryTable = ({ currentUser, onTransferSuccess }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProducts, setTransferProducts] = useState([]);

  React.useEffect(() => {
    if (currentUser) {
      fetchUserInventory();
    }
  }, [currentUser, onTransferSuccess]);

  const fetchUserInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:7224/api/products/user/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      } else {
        setInventory([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferClick = (productsToTransfer) => {
    if (!currentUser) {
      alert('Необходимо авторизоваться');
      return;
    }

    if (productsToTransfer.length === 0) {
      alert('Выберите товары для передачи');
      return;
    }

    setTransferProducts(productsToTransfer);
    setShowTransferModal(true);
  };

  const handleTransferComplete = () => {
    setShowTransferModal(false);
    setTransferProducts([]);
    setSelectedProducts(new Set());
    onTransferSuccess();
    fetchUserInventory();
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="inventory-table">
      <h3>📦 Мой инвентарь</h3>
      
      {loading && <div className="loading">Загрузка инвентаря...</div>}
      
      {!loading && inventory.length === 0 && (
        <div className="no-items">В инвентаре нет товаров</div>
      )}
      
      {!loading && inventory.length > 0 && (
        <>
          <div className="selection-info">
            Выбрано: {selectedProducts.size} товаров
            {selectedProducts.size > 0 && (
              <button 
                className="transfer-selected-btn" 
                onClick={() => handleTransferClick(inventory.filter(item => selectedProducts.has(item.productId)))}
              >
                Передать выбранные
              </button>
            )}
          </div>

          <div className="table-wrapper">
            <table className="inventory-items">
              <thead>
                <tr>
                  <th>Выбор</th>
                  <th>ID товара</th>
                  <th>Название</th>
                  <th>Количество</th>
                  <th>Цена</th>
                  <th>Офис</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.userProductId || item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(item.productId)}
                        onChange={() => toggleProductSelection(item.productId)}
                      />
                    </td>
                    <td>{item.productId}</td>
                    <td>{item.name}</td>
                    <td>{item.countInStock} шт.</td>
                    <td>{item.price} ₽</td>
                    <td>{item.office || 'Не указан'}</td>
                    <td>
                      <button 
                        className="transfer-btn"
                        onClick={() => handleTransferClick([item])}
                        title="Передать товар"
                      >
                        Передать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showTransferModal && (
        <TransferModal 
          products={transferProducts}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferComplete}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default InventoryTable;