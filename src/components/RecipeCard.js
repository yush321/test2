    // src/components/RecipeCard.js
    import React, { useState } from 'react';
    import MissingIngredients from './MissingIngredients'; // 부족한 재료 표시 컴포넌트 import

    // --- 👇 디버깅 로그 추가 👇 ---
    console.log('[RecipeCard.js] Imported MissingIngredients:', MissingIngredients);
    console.log('[RecipeCard.js] typeof MissingIngredients:', typeof MissingIngredients);
    // --- 👆 디버깅 로그 추가 👆 ---


    function RecipeCard({ recipe, userInputIngredients }) {
      const [isExpanded, setIsExpanded] = useState(false);

      const {
        name,
        imageUrl,
        description,
        instructions,
        ingredients,
        userInputSufficient,
        missingIngredients
      } = recipe;

      const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = `https://placehold.co/600x400/EFEFEF/AAAAAA?text=${encodeURIComponent(name)}`;
      }

      return (
        <div className="recipe-card">
          {imageUrl ? (
            <img src={imageUrl} alt={name} onError={handleImageError} />
          ) : (
            <img src={`https://placehold.co/600x400/EFEFEF/AAAAAA?text=${encodeURIComponent(name)}`} alt={name} />
          )}

          <h3>{name}</h3>
          {description && <p>{description}</p>}

          {!userInputSufficient && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="expand-button">
              {isExpanded ? '간략히 보기' : '부족한 재료 및 상세보기'}
            </button>
          )}
          {userInputSufficient && (
             <button onClick={() => setIsExpanded(!isExpanded)} className="expand-button">
                {isExpanded ? '간략히 보기' : '레시피 상세보기'}
            </button>
          )}

          {isExpanded && (
            <div>
              <h4>필요한 전체 재료:</h4>
              {ingredients && ingredients.length > 0 ? (
                <ul>
                  {ingredients.map(ingName => (
                    <li key={ingName}>{ingName}</li>
                  ))}
                </ul>
              ) : <p>제공된 재료 정보가 없습니다.</p>}

              <h4>만드는 법:</h4>
              {instructions && instructions.length > 0 ? (
                <ol>
                  {instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              ) : <p>제공된 요리법 정보가 없습니다.</p>}

              {/* MissingIngredients 컴포넌트 사용 */}
              {!userInputSufficient && <MissingIngredients items={missingIngredients} />}
            </div>
          )}
        </div>
      );
    }

    export default RecipeCard;
    