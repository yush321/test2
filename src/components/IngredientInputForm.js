// src/components/IngredientInputForm.js (onSearch 오류 수정)
import React, { useState, useEffect } from 'react';

// onIngredientsChange: 재료 목록이 변경될 때마다 호출될 함수
function IngredientInputForm({ onIngredientsChange, maxIngredients = 7 }) {
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [localIngredients, setLocalIngredients] = useState([]); // 내부 재료 목록 상태

  // localIngredients가 변경될 때마다 onIngredientsChange를 호출하여 App.js에 알림
  useEffect(() => {
    // onIngredientsChange 함수가 prop으로 전달되었는지 확인 후 호출
    if (typeof onIngredientsChange === 'function') {
      onIngredientsChange(localIngredients);
    }
  }, [localIngredients, onIngredientsChange]); // localIngredients 또는 onIngredientsChange가 변경될 때 실행

  const handleAddIngredient = () => {
    console.log('[IngredientInputForm.js] handleAddIngredient 시작. 입력값:', currentIngredient, '현재 재료 상태:', localIngredients);
    const trimmedInput = currentIngredient.trim().toLowerCase();

    if (trimmedInput && localIngredients.length < maxIngredients && !localIngredients.includes(trimmedInput)) {
      const newIngredients = [...localIngredients, trimmedInput];
      setLocalIngredients(newIngredients); // 내부 상태 업데이트 -> useEffect가 onIngredientsChange 호출
      setCurrentIngredient(''); // 입력 필드 비우기
      console.log('[IngredientInputForm.js] 재료 추가됨:', newIngredients);
    } else {
      console.log('[IngredientInputForm.js] 재료 추가 조건 미충족 또는 중복/초과.');
      if (localIngredients.includes(trimmedInput)) {
          alert("이미 추가된 재료입니다.");
      } else if (localIngredients.length >= maxIngredients) {
          alert(`재료는 최대 ${maxIngredients}개까지 입력할 수 있습니다.`);
      } else if (!trimmedInput) {
          alert("재료를 입력해주세요.");
      }
    }
  };

  const handleRemoveIngredient = (ingredientToRemove) => {
    console.log('[IngredientInputForm.js] handleRemoveIngredient 시작. 삭제할 재료:', ingredientToRemove, '현재 재료 상태:', localIngredients);
    const newIngredients = localIngredients.filter(ing => ing !== ingredientToRemove);
    setLocalIngredients(newIngredients); // 내부 상태 업데이트 -> useEffect가 onIngredientsChange 호출
    console.log('[IngredientInputForm.js] 재료 삭제됨:', newIngredients);
  };

  // 폼 제출 시 (Enter 키 등) currentIngredient를 추가 시도
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[IngredientInputForm.js] handleSubmit 호출됨 (폼 제출).');
    if (currentIngredient.trim()) { // 입력 필드에 내용이 있으면 추가 시도
        handleAddIngredient();
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
        <button type="button" onClick={handleAddIngredient} disabled={localIngredients.length >= maxIngredients}>
          추가
        </button>
      </form>
      <div className="ingredient-tags">
        {localIngredients.map(ing => (
          <span key={ing} className="tag">
            {ing}
            <button onClick={() => handleRemoveIngredient(ing)}>&times;</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default IngredientInputForm;
