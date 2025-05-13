   // src/components/RecipeCard.js (props 로깅 추가)
   import React, { useState } from 'react';
   import ReactMarkdown from 'react-markdown'; // react-markdown 라이브러리 import
   import MissingIngredients from './MissingIngredients';

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

     // --- 👇 props 데이터 로깅 추가 👇 ---
     console.log(`[RecipeCard.js] Recipe: ${name}`);
     console.log(`[RecipeCard.js] Description Data:`, description);
     console.log(`[RecipeCard.js] Instructions Data:`, instructions);
     // --- 👆 props 데이터 로깅 추가 👆 ---

     const handleImageError = (e) => {
       e.target.onerror = null;
       e.target.src = `https://placehold.co/600x400/EFEFEF/AAAAAA?text=${encodeURIComponent(name)}+이미지+준비중`;
     }

     return (
       <div className="recipe-card">
         {imageUrl ? (
           <img src={imageUrl} alt={name} onError={handleImageError} />
         ) : (
           <img src={`https://placehold.co/600x400/EFEFEF/AAAAAA?text=${encodeURIComponent(name)}+이미지+없음`} alt={name} />
         )}

         <h3>{name}</h3>

         {description && (
           <div className="recipe-description">
             <ReactMarkdown>{description}</ReactMarkdown>
           </div>
         )}

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
                   <li key={`${recipe.id}-${ingName}`}>{ingName}</li>
                 ))}
               </ul>
             ) : <p>제공된 재료 정보가 없습니다.</p>}

             <h4>만드는 법:</h4>
             {instructions && instructions.length > 0 ? (
               <ol>
                 {instructions.map((step, index) => (
                   <li key={`${recipe.id}-step-${index}`}>
                     <ReactMarkdown>{step}</ReactMarkdown>
                   </li>
                 ))}
               </ol>
             ) : <p>제공된 요리법 정보가 없습니다.</p>}

             {!userInputSufficient && <MissingIngredients items={missingIngredients} />}
           </div>
         )}
       </div>
     );
   }

   export default RecipeCard;
   