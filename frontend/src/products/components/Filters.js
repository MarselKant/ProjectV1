import React, { useState } from 'react';

const Filters = ({ filters, onChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onChange(localFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      search: '',
      minPrice: '',
      maxPrice: ''
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
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
          onKeyPress={handleKeyPress}
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
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="filter-group">
          <label>до:</label>
          <input
            type="text"
            placeholder="Макс. цена"
            value={localFilters.maxPrice}
            onChange={(e) => handleNumericInput(e, 'maxPrice')}
            onKeyPress={handleKeyPress}
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