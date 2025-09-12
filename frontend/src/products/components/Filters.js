// frontend/src/products/components/Filters.js
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
      maxPrice: '',
      minStock: ''
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
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
            type="number"
            placeholder="Мин. цена"
            value={localFilters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>до:</label>
          <input
            type="number"
            placeholder="Макс. цена"
            value={localFilters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>В наличии от:</label>
          <input
            type="number"
            placeholder="Мин. кол-во"
            value={localFilters.minStock}
            onChange={(e) => handleFilterChange('minStock', e.target.value)}
          />
        </div>
      </div>

      <div className="filter-actions">
        <button onClick={applyFilters}>Применить</button>
        <button onClick={resetFilters}>Сбросить</button>
      </div>
    </div>
  );
};

export default Filters;