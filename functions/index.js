// functions/index.js (ESLint 오류 수정 최종)
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Admin SDK 초기화
if (admin.apps.length === 0) {
  try {
    admin.initializeApp();
    functions.logger.info("Admin SDK 초기화 완료.");
  } catch (e) {
    functions.logger.error("Admin SDK 초기화 실패!", e);
  }
} else {
  functions.logger.info("Admin SDK 이미 초기화되어 있음.");
}
let db;
try {
  db = admin.firestore();
  functions.logger.info("Firestore 인스턴스 가져옴.");
} catch (e) {
  functions.logger.error("Firestore 인스턴스 가져오기 실패!", e);
  db = null;
}

/**
 * 레시피 필터링 규칙 함수 (수정됨)
 * @param {number} recipeIngredientCount 레시피 재료 수.
 * @param {number} userIngredientCount 사용자 입력 재료 수.
 * @param {number} matchCount 일치하는 재료 수.
 * @return {boolean} 표시 여부.
 */
function checkRecipeMatch(recipeIngredientCount, userIngredientCount, matchCount) {
  // 사용자의 새로운 특정 요청 처리 (가장 우선)
  if (recipeIngredientCount === 3 && userIngredientCount === 2) {
    return matchCount === 2; // 3개짜리 레시피, 사용자 2개 입력 -> 2개 일치 시 노출
  }
  if (recipeIngredientCount === 2 && userIngredientCount === 1) {
    return matchCount === 1; // 2개짜리 레시피, 사용자 1개 입력 -> 1개 일치 시 노출
  }

  // 사용자가 1개만 입력한 경우 (위의 특정 조건에 해당하지 않는 경우)
  // "하나만 들어가 있어도 검색이 되는 오류"를 수정하기 위해, 1개 재료 레시피만 대상으로 함
  if (userIngredientCount === 1) {
    return recipeIngredientCount === 1 && matchCount === 1;
  }

  // 사용자가 2개만 입력한 경우 (위의 특정 조건에 해당하지 않는 경우)
  // 2개 재료 레시피에 대해서만, 2개 모두 일치할 때만 보여주도록 수정
  if (userIngredientCount === 2) { // 이 시점에서 recipeIngredientCount는 3이 아님 (위에서 처리됨)
    return recipeIngredientCount === 2 && matchCount === 2;
  }

  // 사용자가 3개 이상 입력 시, 기존의 상세 규칙 적용
  if (userIngredientCount >= 3) {
    if (recipeIngredientCount >= 7) {
      return userIngredientCount >= 5 && matchCount >= 5;
    } else if (recipeIngredientCount === 6) {
      return userIngredientCount >= 4 && matchCount >= 4;
    } else if (recipeIngredientCount === 5) {
      return userIngredientCount >= 3 && matchCount >= 3;
    } else if (recipeIngredientCount === 4) {
      return userIngredientCount >= 3 && matchCount >= 3; // 사용자의 원래 요청은 "3개 일치시" 였으나, 일관성을 위해 "3개 이상 일치시"로 유지.
      // 정확히 3개 일치만 원한다면 matchCount === 3 으로 변경 가능.
    } else if (recipeIngredientCount === 3) {
      // 사용자가 3개 이상 입력했고, 레시피 재료도 3개면, 3개 모두 일치해야 함 (원래 요청 반영)
      return matchCount === 3;
    }
    // recipeIngredientCount가 1 또는 2인데 userIngredientCount가 3 이상인 경우는
    // 해당 레시피의 모든 재료가 일치해야 한다고 볼 수 있습니다 (matchCount === recipeIngredientCount).
    // 하지만 위의 userIngredientCount === 1 또는 2 조건에서 이미 걸러지거나,
    // 여기서 matchCount === recipeIngredientCount 조건을 명시적으로 추가할 수도 있습니다.
    // 현재 로직에서는 이 경우 false로 처리될 수 있습니다.
  }

  return false; // 그 외 모든 경우는 false
}

/**
 * 레시피 검색 및 부족한 재료 광고 링크 반환 함수
 * @param {object} data 클라이언트 데이터.
 * @param {functions.https.CallableContext} context 호출 컨텍스트.
 * @return {Promise<Array<object>>} 레시피 객체 배열.
 */
exports.findRecipes = functions.https.onCall(async (data, context) => {
  functions.logger.info("findRecipes 함수 호출됨. 받은 data 객체 전체:", data, {structuredData: true});
  if (!db) {
    functions.logger.error("Firestore DB 인스턴스가 유효하지 않아 함수 실행 불가.");
    throw new functions.https.HttpsError("internal", "서버 설정 오류.");
  }

  let userIngredients = [];
  const receivedUserIngredients = data.data.userIngredients;
  if (Array.isArray(receivedUserIngredients)) {
    userIngredients = receivedUserIngredients.map((ing) => String(ing).toLowerCase());
  }
  const userIngredientCount = userIngredients.length;
  functions.logger.info("최종 userIngredients 값 (검색용 소문자 한글):", userIngredients);

  const recipeNameQuery = data.data.recipeNameQuery ? String(data.data.recipeNameQuery).toLowerCase().trim() : null;
  functions.logger.info("레시피 이름 검색어:", recipeNameQuery);

  if (userIngredientCount === 0 && !recipeNameQuery) {
    return [];
  }

  const finalRecipesOutput = [];
  const processedRecipeIds = new Set();
  const allIngredientIdsToFetchAds = new Set();

  let recipesQuery = db.collection("recipes");
  let fetchedRecipesSnapshot;

  try {
    // 1. Firestore 쿼리 준비 (재료 기반)
    if (userIngredientCount > 0) {
      functions.logger.info("재료 기반 검색을 위해 'ingredients' 필드에 array-contains-any 쿼리 실행 예정");
      const ingredientsForQuery = userIngredients.slice(0, 30);
      if (ingredientsForQuery.length > 0) {
        recipesQuery = recipesQuery.where("ingredients", "array-contains-any", ingredientsForQuery);
      }
    }

    functions.logger.info("Firestore 'recipes' 컬렉션 읽기 시도...");
    fetchedRecipesSnapshot = await recipesQuery.get();
    functions.logger.info(`Firestore 쿼리 실행 완료. 가져온 문서 개수: ${fetchedRecipesSnapshot.size}`);

    let recipesToProcess = [];
    fetchedRecipesSnapshot.forEach((doc) => {
      recipesToProcess.push({id: doc.id, ...doc.data()});
    });

    // 2. 이름 기반 필터링 (가져온 결과 내에서 수행)
    if (recipeNameQuery) {
      functions.logger.info(`이름 필터링 실행: "${recipeNameQuery}"`);
      recipesToProcess = recipesToProcess.filter((recipe) => {
        const recipeNameLower = String(recipe.name || "").toLowerCase();
        const match = recipeNameLower.includes(recipeNameQuery);
        if (match) {
          functions.logger.debug(`이름 필터링 일치: ${recipe.name}`);
        }
        return match;
      });
      functions.logger.info(`이름 필터링 후 남은 레시피 개수: ${recipesToProcess.length}`);
    }

    // 3. 최종 필터링 및 데이터 가공
    recipesToProcess.forEach((recipe) => {
      if (processedRecipeIds.has(recipe.id)) return;

      if (!recipe.ingredients || !Array.isArray(recipe.ingredients) ||
          !recipe.ingredientIds || !Array.isArray(recipe.ingredientIds) ||
          recipe.ingredients.length !== recipe.ingredientIds.length) {
        functions.logger.warn(`Recipe ${recipe.name} (ID: ${recipe.id}) has missing, invalid, or mismatched ingredients/ingredientIds arrays.`);
        return;
      }

      const recipeIngredientNamesLower = recipe.ingredients.map((ing) => String(ing).toLowerCase());
      const recipeIngredientCount = recipeIngredientNamesLower.length;
      let matchCount = 0;
      const recipeIngredientsSet = new Set(recipeIngredientNamesLower);
      for (const userIng of userIngredients) {
        if (recipeIngredientsSet.has(userIng)) {
          matchCount++;
        }
      }

      const currentRecipeName = recipe.name || "이름 없음";

      if (recipeNameQuery && userIngredientCount === 0) {
        functions.logger.info(`이름 단독 검색: 레시피 ${currentRecipeName} 결과에 포함`);
        const allRecipeIngredientsWithAdPlaceholder = [];
        recipe.ingredientIds.forEach((ingId, index) => {
          allIngredientIdsToFetchAds.add(String(ingId).toLowerCase());
          allRecipeIngredientsWithAdPlaceholder.push({
            name: recipe.ingredients[index],
            id: String(ingId).toLowerCase(),
            adLink: null,
          });
        });
        finalRecipesOutput.push({
          ...recipe,
          userInputSufficient: false,
          missingIngredients: allRecipeIngredientsWithAdPlaceholder,
        });
        processedRecipeIds.add(recipe.id);
      } else if (userIngredientCount > 0 && checkRecipeMatch(recipeIngredientCount, userIngredientCount, matchCount)) {
        functions.logger.info(`재료 기반: 레시피 ${currentRecipeName} 필터링 통과 (재료수:${recipeIngredientCount}, 입력수:${userIngredientCount}, 일치수:${matchCount})`);
        const currentRecipeMissingIngredients = [];
        let isSufficient = true;
        recipe.ingredientIds.forEach((ingId, index) => {
          const currentRecipeKoreanNameLower = String(recipe.ingredients[index]).toLowerCase();
          const userHasKoreanIngredient = userIngredients.includes(currentRecipeKoreanNameLower);
          if (!userHasKoreanIngredient) {
            allIngredientIdsToFetchAds.add(String(ingId).toLowerCase());
            currentRecipeMissingIngredients.push({name: recipe.ingredients[index], id: String(ingId).toLowerCase(), adLink: null});
            isSufficient = false;
          }
        });
        finalRecipesOutput.push({...recipe, userInputSufficient: isSufficient, missingIngredients: currentRecipeMissingIngredients});
        processedRecipeIds.add(recipe.id);
      } else if (userIngredientCount > 0) {
        functions.logger.info(`재료 기반: 레시피 ${currentRecipeName} 필터링 제외 (재료수:${recipeIngredientCount}, 입력수:${userIngredientCount}, 일치수:${matchCount})`);
      }
    });

    // 4. 광고 링크 일괄 조회
    const adLinksMap = new Map();
    if (allIngredientIdsToFetchAds.size > 0) {
      functions.logger.info("광고 링크 조회할 모든 재료 ID 목록:", Array.from(allIngredientIdsToFetchAds));
      try {
        const idsToFetch = Array.from(allIngredientIdsToFetchAds).slice(0, 30);
        if (idsToFetch.length > 0) {
          const adSnapshot = await db.collection("ingredients_ads").where(admin.firestore.FieldPath.documentId(), "in", idsToFetch).get();
          adSnapshot.forEach((doc) => {
            const adData = doc.data();
            if (adData && adData.adLink) {
              adLinksMap.set(doc.id, adData.adLink);
            }
          });
          functions.logger.info("조회된 광고 링크 Map:", adLinksMap);
        }
        if (allIngredientIdsToFetchAds.size > 30) {
          functions.logger.warn("광고 링크 조회 대상 재료 ID가 30개를 초과하여 일부만 조회했습니다.");
        }
      } catch (adError) {
        functions.logger.error("광고 링크 조회 중 오류 발생:", adError);
      }
    }

    // 최종 레시피 목록에 광고 링크 적용
    const recipesWithAds = finalRecipesOutput.map((recipe) => {
      if (recipe.missingIngredients && recipe.missingIngredients.length > 0) {
        const updatedMissingIngredients = recipe.missingIngredients.map((missingIng) => {
          return {
            ...missingIng,
            adLink: adLinksMap.get(missingIng.id) || null,
          };
        });
        return {...recipe, missingIngredients: updatedMissingIngredients};
      }
      return recipe;
    });

    // 5. 최종 정렬
    recipesWithAds.sort((a, b) => {
      if (a.userInputSufficient && !b.userInputSufficient) return -1;
      if (!a.userInputSufficient && b.userInputSufficient) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    functions.logger.info("최종 레시피 목록 반환 직전 데이터:", recipesWithAds);
    return recipesWithAds;
  } catch (error) {
    functions.logger.error("메인 로직 실행 중 오류 발생:", error, {structuredData: true});
    throw new functions.https.HttpsError("internal", "레시피 검색 중 오류가 발생했습니다.");
  }
});
