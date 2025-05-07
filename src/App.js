// src/App.js
import React, { useState, useCallback } from 'react';
import './App.css';
import IngredientInputForm from './components/IngredientInputForm';
import RecipeList from './components/RecipeList';
import { findRecipesFunction } from './firebaseconfig'; // Firebase Functions 호출 함수

console.log('App.js 에서 import 된 IngredientInputForm:', IngredientInputForm);
console.log('App.js 에서 IngredientInputForm 의 typeof:', typeof IngredientInputForm);


function App() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSearchIngredients, setCurrentSearchIngredients] = useState([]);

  const handleSearchRecipes = useCallback(async (ingredients) => {
    if (ingredients.length === 0) {
      // setRecipes([]); // 재료가 없으면 기존 목록을 비우거나, 인기 레시피 등을 요청
      // return;
      // 재료가 없을 때도 findRecipesFunction을 호출하여 (백엔드에서) 기본 레시피 목록을 가져오도록 할 수 있음
    }
    setCurrentSearchIngredients(ingredients);
    setIsLoading(true);
    setError(null);
    try {
      const result = await findRecipesFunction({ userIngredients: ingredients });
      // Firebase Functions는 result.data에 실제 응답을 담아 보냅니다.
      setRecipes(result.data || []);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError("레시피를 불러오는 중 오류가 발생했습니다: " + err.message);
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="container">
      <h1>오늘 뭐 먹지? 🍳</h1>
      <p style={{textAlign: 'center', marginBottom: '30px'}}>
        가지고 있는 재료를 최대 7개까지 입력하고 만들 수 있는 요리를 찾아보세요!
      </p>
      <IngredientInputForm onSearch={handleSearchRecipes} />

      {isLoading && <p className="loading">레시피를 찾고 있습니다...</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && !error && (
        <RecipeList recipes={recipes} userInputIngredients={currentSearchIngredients} />
      )}
    </div>
  );
}

export default App;