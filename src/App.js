// src/App.js (useCallback import 제거)
import React, { useState } from 'react'; // useCallback 제거
import './App.css';
import IngredientInputForm from './components/IngredientInputForm';
import RecipeList from './components/RecipeList';
import { findRecipesFunction } from './firebaseconfig';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [currentIngredients, setCurrentIngredients] = useState([]);
  const [recipeNameQuery, setRecipeNameQuery] = useState('');

  // App 컴포넌트 렌더링 시 currentIngredients 상태 로깅
  console.log('[App.js RENDER] 현재 currentIngredients 상태:', currentIngredients);

  // 재료 추가 함수
  const addIngredient = (ingredientToAdd) => {
    setCurrentIngredients(prevIngredients => {
      if (!prevIngredients.includes(ingredientToAdd) && prevIngredients.length < 7) {
        const newIngredients = [...prevIngredients, ingredientToAdd];
        console.log('[App.js] addIngredient 호출됨. 추가된 재료:', ingredientToAdd, '새 재료 목록:', newIngredients);
        return newIngredients;
      }
      return prevIngredients;
    });
  };

  // 재료 삭제 함수
  const removeIngredient = (ingredientToRemove) => {
    setCurrentIngredients(prevIngredients => {
      const newIngredients = prevIngredients.filter(ing => ing !== ingredientToRemove);
      console.log('[App.js] removeIngredient 호출됨. 삭제된 재료:', ingredientToRemove, '새 재료 목록:', newIngredients);
      return newIngredients;
    });
  };

  // 요리 이름 검색어 변경 핸들러 (useCallback 없이도 괜찮음)
  const handleRecipeNameChange = (event) => {
    setRecipeNameQuery(event.target.value);
  };

  // "레시피 검색" 버튼 클릭 시 실행될 함수
  const handleCombinedSearch = async () => {
    console.log('[[[App.js]]] "레시피 검색" 버튼 클릭! handleCombinedSearch 함수 호출됨.');
    console.log('[App.js] handleCombinedSearch 시작. 이 시점의 currentIngredients:', currentIngredients, '이름 검색어:', recipeNameQuery);

    if (currentIngredients.length === 0 && !recipeNameQuery.trim()) {
      console.log('[App.js] 입력된 재료와 이름 검색어가 모두 없습니다.');
      setRecipes([]);
      setError("검색할 재료나 요리 이름을 입력해주세요.");
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
        if (result.data.length === 0) {
            setError("검색된 레시피가 없습니다.");
        }
      } else {
        console.warn('[App.js] 함수로부터 받은 데이터가 없거나 result.data가 비어있습니다. result:', result);
        setRecipes([]);
        setError("검색된 레시피가 없습니다.");
      }
    } catch (err) {
      console.error("[App.js] findRecipesFunction 호출 중 또는 이후 처리 중 오류:", err);
      let errorMessage = "레시피를 불러오는 중 오류가 발생했습니다.";
      // ... (오류 메시지 처리 로직은 이전과 동일) ...
      setError(errorMessage);
      setRecipes([]);
    } finally {
      console.log('[App.js] handleCombinedSearch 로직 완료, isLoading: false 설정.');
      setIsLoading(false);
    }
  };

  // 초기화 함수
  const handleReset = () => {
    console.log('[App.js] handleReset 호출됨. 모든 입력 및 결과 초기화.');
    setCurrentIngredients([]);
    setRecipeNameQuery('');
    setRecipes([]);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>오늘 뭐 먹지? 🍳</h1>
        <p>가진 재료나 요리 이름으로 레시피를 찾아보세요!</p>
      </header>

      <main className="search-section">
        <div className="search-input-group">
          <input
            type="text"
            className="recipe-name-input"
            value={recipeNameQuery}
            onChange={handleRecipeNameChange}
            placeholder="요리 이름으로 검색 (예: 김치찌개)"
          />
        </div>
        
        <IngredientInputForm 
          ingredients={currentIngredients} 
          onAdd={addIngredient}
          onRemove={removeIngredient}
        />

        <div className="search-actions">
          <button 
            onClick={handleCombinedSearch} 
            disabled={isLoading}
            className="search-button"
          >
            {isLoading ? '검색 중...' : '레시피 찾기'}
          </button>
          <button
            onClick={handleReset}
            type="button" 
            className="reset-button"
          >
            초기화
          </button>
        </div>
      </main>

      <section className="results-section">
        {isLoading && <p className="loading-message">레시피를 찾고 있습니다...</p>}
        {error && !isLoading && <p className="error-message">{error}</p>}
        
        {!isLoading && !error && recipes.length === 0 && (currentIngredients.length > 0 || recipeNameQuery.trim()) && !error && (
            <p className="loading-message">검색된 레시피가 없습니다.</p>
        )}
        {!isLoading && !error && recipes.length > 0 && (
          <RecipeList recipes={recipes} userInputIngredients={currentIngredients} />
        )}
      </section>
    </div>
  );
}

export default App;
