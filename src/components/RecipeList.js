// src/components/RecipeList.js
import React from 'react';
import RecipeCard from './RecipeCard';



function RecipeList({ recipes, userInputIngredients }) {
  if (!recipes || recipes.length === 0) {
    return <p className="loading">레시피를 찾을 수 없거나, 검색된 결과가 없습니다. 다른 재료를 입력해보세요.</p>;
  }

  return (
    <div className="recipe-list">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          userInputIngredients={userInputIngredients}
        />
      ))}
    </div>
  );
}

export default RecipeList;