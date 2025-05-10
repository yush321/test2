// src/components/IngredientInputForm.js (App.js와 연동 - 재확인)
import React, { useState } from 'react';

// ingredients: App.js에서 관리하는 현재 재료 목록
// onAdd: App.js의 재료 추가 함수
// onRemove: App.js의 재료 삭제 함수
function IngredientInputForm({ ingredients, onAdd, onRemove, maxIngredients = 7 }) {
  const [currentIngredient, setCurrentIngredient] = useState(''); // 입력 필드용 상태

  const handleAddClick = () => {
    console.log('[IngredientInputForm.js] handleAddClick 시작. 입력값:', currentIngredient);
    const trimmedInput = currentIngredient.trim().toLowerCase();

    // onAdd 함수가 prop으로 제대로 전달되었는지 확인 (안전장치)
    if (typeof onAdd !== 'function') {
        console.error("[IngredientInputForm.js] onAdd prop이 함수가 아닙니다!");
        return;
    }

    if (trimmedInput && ingredients.length < maxIngredients && !ingredients.includes(trimmedInput)) {
      onAdd(trimmedInput); // App.js에 재료 추가 요청
      setCurrentIngredient(''); // 입력 필드 비우기
      console.log('[IngredientInputForm.js] 재료 추가 요청됨:', trimmedInput);
    } else {
      console.log('[IngredientInputForm.js] 재료 추가 조건 미충족 또는 중복/초과.');
      if (ingredients.includes(trimmedInput)) {
          alert("이미 추가된 재료입니다.");
      } else if (ingredients.length >= maxIngredients) {
          alert(`재료는 최대 ${maxIngredients}개까지 입력할 수 있습니다.`);
      } else if (!trimmedInput) {
          alert("재료를 입력해주세요.");
      }
    }
  };

  const handleRemoveClick = (ingredientToRemove) => {
    console.log('[IngredientInputForm.js] handleRemoveClick 시작. 삭제할 재료:', ingredientToRemove);
    // onRemove 함수가 prop으로 제대로 전달되었는지 확인 (안전장치)
    if (typeof onRemove !== 'function') {
        console.error("[IngredientInputForm.js] onRemove prop이 함수가 아닙니다!");
        return;
    }
    onRemove(ingredientToRemove); // App.js에 재료 삭제 요청
  };

  // 폼 제출 시 (Enter 키 등) currentIngredient를 추가 시도
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[IngredientInputForm.js] handleSubmit 호출됨 (폼 제출).');
    if (currentIngredient.trim()) {
        handleAddClick();
    }
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
        <button type="button" onClick={handleAddClick} disabled={ingredients.length >= maxIngredients}>
          추가
        </button>
      </form>
      <div className="ingredient-tags">
        {/* App.js로부터 받은 ingredients 배열을 사용하여 태그 표시 */}
        {ingredients.map(ing => (
          <span key={ing} className="tag">
            {ing}
            <button onClick={() => handleRemoveClick(ing)}>&times;</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default IngredientInputForm;
