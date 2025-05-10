// src/App.js (버튼 클릭 HTML 기본 테스트)
import React, { useState, useCallback } from 'react';
import './App.css';
import IngredientInputForm from './components/IngredientInputForm';
import RecipeList from './components/RecipeList';
import { findRecipesFunction } from './firebaseconfig';

// 앱 로드 시점에 import된 모듈들 확인 (디버깅용)
console.log('[App.js 로드 시] IngredientInputForm:', IngredientInputForm);
console.log('[App.js 로드 시] typeof IngredientInputForm:', typeof IngredientInputForm);
console.log('[App.js 로드 시] findRecipesFunction:', findRecipesFunction);
console.log('[App.js 로드 시] typeof findRecipesFunction:', typeof findRecipesFunction);

function App() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // isLoading 상태는 유지
  const [error, setError] = useState(null);
  
  const [currentIngredients, setCurrentIngredients] = useState([]);
  const [recipeNameQuery, setRecipeNameQuery] = useState('');

  const handleIngredientsChange = useCallback((updatedIngredients) => {
    console.log('[App.js] IngredientInputForm에서 재료 변경됨:', updatedIngredients);
    setCurrentIngredients(updatedIngredients);
  }, []);

  const handleRecipeNameChange = (event) => {
    setRecipeNameQuery(event.target.value);
  };

  // "레시피 검색" 버튼 클릭 시 실행될 함수 (원래 로직은 유지)
  const handleCombinedSearch = useCallback(async () => {
    console.log('[[[App.js]]] "레시피 검색" 버튼 클릭! handleCombinedSearch 함수 호출됨.');
    console.log('[App.js] handleCombinedSearch 상세 로직 시작. 현재 재료:', currentIngredients, '이름 검색어:', recipeNameQuery);

    if (currentIngredients.length === 0 && !recipeNameQuery.trim()) {
      console.log('[App.js] 입력된 재료와 이름 검색어가 모두 없습니다.');
      setRecipes([]);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      if (typeof findRecipesFunction !== 'function') {
        console.error('[App.js] CRITICAL: findRecipesFunction이 함수가 아닙니다!', findRecipesFunction);
        throw new Error('findRecipesFunction is not a function.');
      }
      const payload = {
        userIngredients: currentIngredients,
        recipeNameQuery: recipeNameQuery.trim(),
      };
      console.log('[App.js] findRecipesFunction 호출 실행. 전달 데이터:', payload);
      const result = await findRecipesFunction(payload);
      console.log('[App.js] findRecipesFunction 결과 받음:', result);
      if (result && result.data) {
        console.log('[App.js] 함수로부터 받은 데이터 (result.data):', result.data);
        setRecipes(result.data);
      } else {
        console.warn('[App.js] 함수로부터 받은 데이터가 없거나 result.data가 비어있습니다. result:', result);
        setRecipes([]);
      }
    } catch (err) {
      console.error("[App.js] findRecipesFunction 호출 중 또는 이후 처리 중 오류:", err);
      let errorMessage = "레시피를 불러오는 중 오류가 발생했습니다.";
      if (err.name === 'FirebaseError' && err.code && err.code.startsWith('functions/')) {
        errorMessage = `서버 함수 호출 오류: ${err.message} (코드: ${err.code})`;
        if (err.details) { console.error("Firebase Functions 오류 상세:", err.details); }
        if (err.code.toLowerCase().includes('appcheck')) {
           errorMessage = "앱 인증에 실패했습니다. App Check 설정을 확인하거나 잠시 후 다시 시도해주세요. (오류 코드: " + err.code + ")";
        }
      } else if (err.message) {
        errorMessage += " 오류 메시지: " + err.message;
      }
      setError(errorMessage);
      setRecipes([]);
    } finally {
      console.log('[App.js] handleCombinedSearch 로직 완료, isLoading: false 설정.');
      setIsLoading(false);
    }
  }, [currentIngredients, recipeNameQuery]);

  // testButtonClick 함수는 현재 사용되지 않으므로 주석 처리 또는 삭제 가능
  // const testButtonClick = () => {
  //   alert('[[[App.js]]] "레시피 검색" 버튼의 onClick 이벤트가 testButtonClick 함수를 통해 직접 발생했습니다!');
  //   console.log('[[[App.js]]] testButtonClick 함수가 호출되었습니다. isLoading 상태:', isLoading);
  // };

  return (
    <div className="container">
      <h1>오늘 뭐 먹지? 🍳</h1>
      <p style={{textAlign: 'center', marginBottom: '10px'}}>
        가지고 있는 재료를 최대 7개까지 입력하거나,
      </p>
      <p style={{textAlign: 'center', marginBottom: '20px'}}>
        요리 이름으로 검색해보세요!
      </p>

      <div className="recipe-name-search-form" style={{marginBottom: '20px', textAlign: 'center'}}>
        <input
          type="text"
          value={recipeNameQuery}
          onChange={handleRecipeNameChange}
          placeholder="요리 이름으로 검색 (예: 김치찌개)"
          style={{padding: '10px', marginRight: '10px', width: '60%', maxWidth: '300px', borderRadius: '4px', border: '1px solid #ddd'}}
        />
      </div>
      
      <IngredientInputForm onIngredientsChange={handleIngredientsChange} />

      <div style={{textAlign: 'center', marginTop: '20px', marginBottom: '30px'}}>
        {/* --- 👇 onClick 핸들러를 매우 단순한 인라인 alert으로 수정 👇 --- */}
        <button 
          onClick={() => alert('버튼이 정말로 클릭되었습니다!')}
          disabled={isLoading}
          style={{padding: '10px 20px', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px'}}
        >
        {/* --- 👆 onClick 핸들러를 매우 단순한 인라인 alert으로 수정 👆 --- */}
          {isLoading ? '검색 중...' : '레시피 검색'}
        </button>
      </div>

      {isLoading && <p className="loading">레시피를 찾고 있습니다...</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && !error && recipes.length === 0 && (currentIngredients.length > 0 || recipeNameQuery.trim()) && (
        <p className="loading">검색된 레시피가 없습니다.</p>
      )}
      {!isLoading && !error && recipes.length > 0 && (
        <RecipeList recipes={recipes} userInputIngredients={currentIngredients} />
      )}
    </div>
  );
}

export default App;
