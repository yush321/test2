// src/components/IngredientInputForm.js
import React, { useState } from 'react';

function IngredientInputForm({ onSearch, maxIngredients = 7 }) {
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [ingredients, setIngredients] = useState([]);

  const handleAddIngredient = () => {
    if (currentIngredient.trim() && ingredients.length < maxIngredients && !ingredients.includes(currentIngredient.trim().toLowerCase())) {
      const newIngredients = [...ingredients, currentIngredient.trim().toLowerCase()];
      setIngredients(newIngredients);
      setCurrentIngredient('');
      onSearch(newIngredients); // 재료 추가 시 바로 검색
    } else if (ingredients.includes(currentIngredient.trim().toLowerCase())) {
        alert("이미 추가된 재료입니다.");
    } else if (ingredients.length >= maxIngredients) {
        alert(`재료는 최대 ${maxIngredients}개까지 입력할 수 있습니다.`);
    }
  };

  const handleRemoveIngredient = (ingredientToRemove) => {
    const newIngredients = ingredients.filter(ing => ing !== ingredientToRemove);
    setIngredients(newIngredients);
    onSearch(newIngredients); // 재료 삭제 시 바로 검색
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // 폼 기본 제출 방지
    onSearch(ingredients);
  };


  return (
    <div>
      <form onSubmit={handleSubmit} className="ingredient-form">
        <input
          type="text"
          value={currentIngredient}
          onChange={(e) => setCurrentIngredient(e.target.value)}
          placeholder="재료를 입력하세요 (예: 계란)"
        />
        <button type="button" onClick={handleAddIngredient} disabled={ingredients.length >= maxIngredients}>
          추가
        </button>
      </form>
      <div className="ingredient-tags">
        {ingredients.map(ing => (
          <span key={ing} className="tag">
            {ing}
            <button onClick={() => handleRemoveIngredient(ing)}>&times;</button>
          </span>
        ))}
      </div>
      {/* <button onClick={() => onSearch(ingredients)} disabled={ingredients.length === 0}>
        레시피 검색
      </button> */}
      {/* 재료 추가/삭제 시 자동 검색하므로 위 검색 버튼은 필요 없을 수 있음 */}
    </div>
  );
}

export default IngredientInputForm;