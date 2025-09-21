// frontend/src/products/components/Filters.js
import React, { useState } from 'react';

const Filters = ({ filters, onChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    let processedValue = value;
    
    if (key === 'minPrice' || key === 'maxPrice' || key === 'minStock') {
      if (value < 0) {
        processedValue = '';
      }
    }
    
    const newFilters = { ...localFilters, [key]: processedValue };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    const processedFilters = {
      ...localFilters,
      search: localFilters.search ? localFilters.search.toLowerCase() : '',
      minPrice: localFilters.minPrice ? parseFloat(localFilters.minPrice) : '',
      maxPrice: localFilters.maxPrice ? parseFloat(localFilters.maxPrice) : '',
      minStock: localFilters.minStock ? parseInt(localFilters.minStock) : ''
    };
    onChange(processedFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      search: '',
      minPrice: '',
      maxPrice: '',
      minStock: ''
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  };

  const handleNumericInput = (e, key) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleFilterChange(key, value);
    }
  };

  return (
    <div className="filters">
      <h3>Фильтры</h3>
      
      <div className="filter-group">
        <input
          type="text"
          placeholder="Поиск по названию и описанию..."
          value={localFilters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label>Цена от:</label>
          <input
            type="text"
            placeholder="Мин. цена"
            value={localFilters.minPrice}
            onChange={(e) => handleNumericInput(e, 'minPrice')}
            onBlur={() => {
              if (localFilters.minPrice && parseFloat(localFilters.minPrice) < 0) {
                handleFilterChange('minPrice', '');
                alert('Цена не может быть отрицательной');
              }
            }}
          />
        </div>

        <div className="filter-group">
          <label>до:</label>
          <input
            type="text"
            placeholder="Макс. цена"
            value={localFilters.maxPrice}
            onChange={(e) => handleNumericInput(e, 'maxPrice')}
            onBlur={() => {
              if (localFilters.maxPrice && parseFloat(localFilters.maxPrice) < 0) {
                handleFilterChange('maxPrice', '');
                alert('Цена не может быть отрицательной');
              }
            }}
          />
        </div>

        <div className="filter-group">
          <label>В наличии от:</label>
          <input
            type="text"
            placeholder="Мин. кол-во"
            value={localFilters.minStock}
            onChange={(e) => handleNumericInput(e, 'minStock')}
            onBlur={() => {
              if (localFilters.minStock && parseInt(localFilters.minStock) < 0) {
                handleFilterChange('minStock', '');
                alert('Количество не может быть отрицательным');
              }
            }}
          />
        </div>
      </div>

      <div className="filter-actions">
        <button onClick={applyFilters} className="primary-btn">Применить</button>
        <button onClick={resetFilters} className="secondary-btn">Сбросить</button>
      </div>
    </div>
  );
};

export default Filters;