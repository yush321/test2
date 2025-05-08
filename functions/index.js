// functions/index.js (ESLint 오류 수정)
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Admin SDK 초기화 등은 이전과 동일
if (admin.apps.length === 0) {
  try {
    admin.initializeApp(); functions.logger.info("Admin SDK 초기화 완료.");
  } catch (e) {
    functions.logger.error("Admin SDK 초기화 실패!", e);
  }
} else {
  functions.logger.info("Admin SDK 이미 초기화되어 있음.");
}
let db; try {
  db = admin.firestore(); functions.logger.info("Firestore 인스턴스 가져옴.");
} catch (e) {
  functions.logger.error("Firestore 인스턴스 가져오기 실패!", e); db = null;
}

/**
 * 레시피 필터링 규칙 함수
 * @param {number} recipeIngredientCount 레시피 재료 수.
 * @param {number} userIngredientCount 사용자 입력 재료 수.
 * @param {number} matchCount 일치하는 재료 수.
 * @return {boolean} 표시 여부.
 */
function checkRecipeMatch(recipeIngredientCount, userIngredientCount, matchCount) {
  if (recipeIngredientCount >= 7) {
    return userIngredientCount >= 5 && matchCount >= 5;
  } else if (recipeIngredientCount === 6) {
    return userIngredientCount >= 4 && matchCount >= 4;
  } else if (recipeIngredientCount === 5) {
    return userIngredientCount >= 3 && matchCount >= 3;
  } else if (recipeIngredientCount === 4) {
    return userIngredientCount >= 3 && matchCount >= 3;
  } else if (recipeIngredientCount === 3) {
    return userIngredientCount >= 3 && matchCount === 3;
  } else if (recipeIngredientCount > 0) {
    return matchCount === recipeIngredientCount && userIngredientCount >= recipeIngredientCount;
  }
  return false;
}

/**
 * 레시피 검색 및 부족한 재료 광고 링크 반환 함수
 * @param {object} data 클라이언트 데이터.
 * @param {functions.https.CallableContext} context 호출 컨텍스트.
 * @return {Promise<Array<object>>} 레시피 객체 배열.
 */
exports.findRecipes = functions.https.onCall(async (data, context) => {
  functions.logger.info("findRecipes 함수 호출됨. 받은 data 객체 전체:", data, {structuredData: true});
  functions.logger.info("함수 로직 실행 시작.");
  if (!db || typeof db.collection !== "function") {
    /* ... DB 오류 처리 ... */ throw new functions.https.HttpsError("internal", "서버 설정 오류.");
  }
  functions.logger.info("Firestore DB 인스턴스 유효함 확인.");

  let userIngredients = [];
  const receivedUserIngredients = data.data.userIngredients;
  if (Array.isArray(receivedUserIngredients)) {
    userIngredients = receivedUserIngredients.map((ing) => String(ing).toLowerCase());
  } else {
    functions.logger.warn("받은 userIngredients가 배열이 아닙니다:", receivedUserIngredients);
  }
  const userIngredientCount = userIngredients.length;
  functions.logger.info("최종 userIngredients 값:", userIngredients);

  if (userIngredientCount === 0) {
    return [];
  }

  functions.logger.info("사용자 재료 기반 레시피 검색 시작 (필터링 로직 포함):", userIngredients, {structuredData: true});

  const allMissingIngredientIds = new Set();
  let recipesWithMissingInfo = [];

  try {
    functions.logger.info("Firestore 'recipes' 컬렉션 읽기 시도...");
    const recipesSnapshot = await db.collection("recipes").get();
    functions.logger.info("'recipes' 컬렉션 읽기 성공. 문서 개수:", recipesSnapshot.size);

    const potentialMatches = [];
    recipesSnapshot.forEach((doc) => {
      const recipeData = doc.data();
      functions.logger.debug(`Firestore 문서 ${doc.id} 데이터 로드됨:`, recipeData, {structuredData: true});
      const recipe = {id: doc.id, ...recipeData};

      if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0 ||
          !recipe.ingredientIds || !Array.isArray(recipe.ingredientIds) ||
          recipe.ingredients.length !== recipe.ingredientIds.length) {
        functions.logger.warn(`Recipe ${recipe.name} (ID: ${recipe.id}) has missing, invalid, or mismatched ingredients/ingredientIds arrays.`);
        return;
      }

      const recipeIngredientNames = recipe.ingredients.map((ing) => String(ing).toLowerCase());
      const recipeIngredientCount = recipeIngredientNames.length;
      let matchCount = 0;
      const recipeIngredientsSet = new Set(recipeIngredientNames);
      for (const userIng of userIngredients) {
        if (recipeIngredientsSet.has(userIng)) {
          matchCount++;
        }
      }

      const currentRecipeName = recipe.name || "이름 없음";
      if (checkRecipeMatch(recipeIngredientCount, userIngredientCount, matchCount)) {
        functions.logger.info(`레시피 ${currentRecipeName} 필터링 통과 (재료수:${recipeIngredientCount}, 입력수:${userIngredientCount}, 일치수:${matchCount})`);
        potentialMatches.push({recipe, recipeIngredientIds: recipe.ingredientIds}); // 영어 ID 배열 전달
      } else {
        functions.logger.info(`레시피 ${currentRecipeName} 필터링 제외 (재료수:${recipeIngredientCount}, 입력수:${userIngredientCount}, 일치수:${matchCount})`);
      }
    });

    // 부족한 재료 계산
    recipesWithMissingInfo = potentialMatches.map(({recipe, recipeIngredientIds}) => {
      const missingIngredients = [];
      let userInputSufficient = true;
      recipeIngredientIds.forEach((recipeIngId, index) => {
        // 사용자 입력(한글 소문자)과 레시피의 한글 이름(소문자) 비교
        const currentRecipeKoreanNameLower = String(recipe.ingredients[index]).toLowerCase();
        const userHasKoreanIngredient = userIngredients.includes(currentRecipeKoreanNameLower);

        // --- 👇 userHasIngredient 변수 제거 👇 ---
        if (!userHasKoreanIngredient) { // 한글 이름 기준으로 사용자가 가지고 있는지 확인
        // --- 👆 userHasIngredient 변수 제거 👆 ---
          const originalKoreanName = recipe.ingredients[index]; // 한글 이름
          const englishId = recipe.ingredientIds[index]; // 해당 영어 ID
          missingIngredients.push({name: originalKoreanName, id: englishId, adLink: null});
          allMissingIngredientIds.add(englishId); // 광고 조회는 영어 ID로
          userInputSufficient = false;
        }
      });
      return {...recipe, userInputSufficient, missingIngredients};
    });

    // 광고 링크 조회 로직
    const adLinksMap = new Map();
    if (allMissingIngredientIds.size > 0) {
      functions.logger.info("광고 링크 조회할 부족한 재료 ID 목록:", Array.from(allMissingIngredientIds));
      try {
        const missingIngredientIds = Array.from(allMissingIngredientIds).slice(0, 30);
        if (missingIngredientIds.length > 0) {
          const adSnapshot = await db.collection("ingredients_ads").where(admin.firestore.FieldPath.documentId(), "in", missingIngredientIds).get();
          adSnapshot.forEach((doc) => {
            const adData = doc.data(); if (adData && adData.adLink) {
              adLinksMap.set(doc.id, adData.adLink);
            }
          });
          functions.logger.info("조회된 광고 링크 Map:", adLinksMap);
        }
        if (allMissingIngredientIds.size > 30) {
          functions.logger.warn("부족한 재료가 30개를 초과하여 일부 광고 링크만 조회했습니다.");
        }
      } catch (adError) {
        functions.logger.error("광고 링크 조회 중 오류 발생:", adError);
      }
    }

    // 광고 링크 매핑
    const finalRecipes = recipesWithMissingInfo.map((recipe) => {
      if (!recipe.userInputSufficient) {
        recipe.missingIngredients = recipe.missingIngredients.map((missingIng) => {
          const lowerCaseName = missingIng.id; // 이미 영어 ID를 가지고 있음
          return {...missingIng, adLink: adLinksMap.get(lowerCaseName) || null};
        });
      }
      return recipe;
    });

    // 최종 정렬
    finalRecipes.sort((a, b) => {
      if (a.userInputSufficient && !b.userInputSufficient) return -1;
      if (!a.userInputSufficient && b.userInputSufficient) return 1;
      return a.name.localeCompare(b.name);
    });

    functions.logger.info("최종 레시피 목록 반환 직전 데이터:", finalRecipes);
    return finalRecipes; // 최종 결과 반환
  } catch (error) {
    functions.logger.error("메인 로직 실행 중 오류 발생:", error, {structuredData: true});
    throw new functions.https.HttpsError("internal", "레시피 검색 중 오류가 발생했습니다.");
  }
});
