    // src/components/IngredientInputForm.js (로깅 추가)
    import React, { useState } from 'react';

    function IngredientInputForm({ onSearch, maxIngredients = 7 }) {
      const [currentIngredient, setCurrentIngredient] = useState('');
      const [ingredients, setIngredients] = useState([]); // 현재 추가된 재료 목록 상태

      const handleAddIngredient = () => {
        // --- 👇 로그 추가 👇 ---
        console.log('[IngredientInputForm.js] handleAddIngredient 시작. 입력값:', currentIngredient, '현재 재료 상태:', ingredients);
        // --- 👆 로그 추가 👆 ---
        const trimmedInput = currentIngredient.trim().toLowerCase();

        if (trimmedInput && ingredients.length < maxIngredients && !ingredients.includes(trimmedInput)) {
          const newIngredients = [...ingredients, trimmedInput];
          setIngredients(newIngredients); // 상태 업데이트
          setCurrentIngredient(''); // 입력 필드 비우기

          // --- 👇 로그 추가 👇 ---
          console.log('[IngredientInputForm.js] onSearch 호출 예정. 전달할 재료:', newIngredients);
          // --- 👆 로그 추가 👆 ---
          onSearch(newIngredients); // 업데이트된 재료 목록으로 onSearch 호출
        } else {
          // --- 👇 로그 추가 👇 ---
          console.log('[IngredientInputForm.js] 재료 추가 조건 미충족 또는 중복/초과.');
          // --- 👆 로그 추가 👆 ---
          if (ingredients.includes(trimmedInput)) {
              alert("이미 추가된 재료입니다.");
          } else if (ingredients.length >= maxIngredients) {
              alert(`재료는 최대 ${maxIngredients}개까지 입력할 수 있습니다.`);
          } else if (!trimmedInput) {
              alert("재료를 입력해주세요.");
          }
        }
      };

      const handleRemoveIngredient = (ingredientToRemove) => {
        // --- 👇 로그 추가 👇 ---
        console.log('[IngredientInputForm.js] handleRemoveIngredient 시작. 삭제할 재료:', ingredientToRemove, '현재 재료 상태:', ingredients);
        // --- 👆 로그 추가 👆 ---
        const newIngredients = ingredients.filter(ing => ing !== ingredientToRemove);
        setIngredients(newIngredients); // 상태 업데이트

        // --- 👇 로그 추가 👇 ---
        console.log('[IngredientInputForm.js] onSearch 호출 예정 (삭제 후). 전달할 재료:', newIngredients);
        // --- 👆 로그 추가 👆 ---
        onSearch(newIngredients); // 업데이트된 재료 목록으로 onSearch 호출
      };

      const handleSubmit = (e) => {
        e.preventDefault(); // 폼 기본 제출 방지
        // --- 👇 로그 추가 👇 ---
        console.log('[IngredientInputForm.js] handleSubmit 호출됨 (폼 제출). 현재 재료 상태:', ingredients);
        // --- 👆 로그 추가 👆 ---
        // 폼 제출 시에는 현재 ingredients 상태 그대로 검색 (보통은 이 버튼이 없을 수 있음)
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
        </div>
      );
    }

    export default IngredientInputForm;
    