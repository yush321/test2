// functions/index.js (ESLint 오류 최종 수정)
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
    return userIngredientCount >= 2 && matchCount >= 2;
  } else if (recipeIngredientCount === 2) {
    return userIngredientCount >= 1 && matchCount >= 1;
  } else if (recipeIngredientCount === 1) {
    return userIngredientCount >=1 && matchCount === 1;
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
    throw new functions.https.HttpsError("internal", "서버 설정 오류.");
  }
  functions.logger.info("Firestore DB 인스턴스 유효함 확인.");

  let userIngredients = [];
  const receivedUserIngredients = data.data.userIngredients;
  if (Array.isArray(receivedUserIngredients)) {
    userIngredients = receivedUserIngredients.map((ing) => String(ing).toLowerCase());
  }
  const userIngredientCount = userIngredients.length;
  functions.logger.info("최종 userIngredients 값:", userIngredients);

  const recipeNameQuery = data.data.recipeNameQuery ? String(data.data.recipeNameQuery).toLowerCase().trim() : null;
  functions.logger.info("레시피 이름 검색어:", recipeNameQuery);

  if (userIngredientCount === 0 && !recipeNameQuery) {
    return [];
  }

  const finalRecipesOutput = [];
  const processedRecipeIds = new Set();
  const allIngredientIdsToFetchAds = new Set();

  try {
    functions.logger.info("Firestore 'recipes' 컬렉션 읽기 시도...");
    const recipesSnapshot = await db.collection("recipes").get();
    functions.logger.info("'recipes' 컬렉션 읽기 성공. 문서 개수:", recipesSnapshot.size);

    // 1. 이름 기반 검색
    if (recipeNameQuery) {
      functions.logger.info(`이름 검색 실행: "${recipeNameQuery}"`);
      recipesSnapshot.forEach((doc) => {
        const recipeData = doc.data();
        const recipe = {id: doc.id, ...recipeData};
        const recipeNameLower = String(recipe.name || "").toLowerCase();
        functions.logger.debug(`이름 비교: 레시피 이름 ("${recipeNameLower}") vs 검색어 ("${recipeNameQuery}")`);
        if (recipeNameLower.includes(recipeNameQuery)) {
          if (!processedRecipeIds.has(recipe.id)) {
            functions.logger.info(`이름 검색 일치: ${recipe.name} (ID: ${recipe.id})`);
            const allRecipeIngredientsWithAdPlaceholder = [];
            if (recipe.ingredients && recipe.ingredientIds && recipe.ingredients.length === recipe.ingredientIds.length) {
              recipe.ingredientIds.forEach((ingId, index) => {
                allIngredientIdsToFetchAds.add(String(ingId).toLowerCase());
                allRecipeIngredientsWithAdPlaceholder.push({
                  name: recipe.ingredients[index],
                  id: String(ingId).toLowerCase(),
                  adLink: null,
                });
              });
            }
            finalRecipesOutput.push({
              ...recipe,
              userInputSufficient: false,
              missingIngredients: allRecipeIngredientsWithAdPlaceholder,
            });
            processedRecipeIds.add(recipe.id);
          }
        }
      });
      functions.logger.info(`이름 검색 후 중간 결과 (finalRecipesOutput) 개수: ${finalRecipesOutput.length}`);
    }

    // 2. 재료 기반 검색
    functions.logger.info(`재료 기반 검색 진입 직전 userIngredientCount 값: ${userIngredientCount}`);
    if (userIngredientCount > 0) {
      functions.logger.info("재료 기반 검색 실행:", userIngredients);
      recipesSnapshot.forEach((doc) => {
        if (processedRecipeIds.has(doc.id)) {
          return;
        }
        const recipeData = doc.data();
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
          functions.logger.info(`재료 검색: 레시피 ${currentRecipeName} 필터링 통과 (재료수:${recipeIngredientCount}, 입력수:${userIngredientCount}, 일치수:${matchCount})`);
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
        } else {
          functions.logger.info(`재료 검색: 레시피 ${currentRecipeName} 필터링 제외 (재료수:${recipeIngredientCount}, 입력수:${userIngredientCount}, 일치수:${matchCount})`);
        }
      });
    }

    // 3. 광고 링크 일괄 조회
    const adLinksMap = new Map(); // adLinksMap 선언 및 초기화
    if (allIngredientIdsToFetchAds.size > 0) {
      functions.logger.info("광고 링크 조회할 모든 재료 ID 목록:", Array.from(allIngredientIdsToFetchAds));
      try {
        const idsToFetch = Array.from(allIngredientIdsToFetchAds).slice(0, 30);
        if (idsToFetch.length > 0) {
          const adSnapshot = await db.collection("ingredients_ads").where(admin.firestore.FieldPath.documentId(), "in", idsToFetch).get();
          adSnapshot.forEach((doc) => {
            const adData = doc.data();
            if (adData && adData.adLink) {
              adLinksMap.set(doc.id, adData.adLink); // Map에 링크 저장
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
    // --- 👇 .map() 콜백에서 return 추가 및 adLinksMap 사용 👇 ---
    const recipesWithAds = finalRecipesOutput.map((recipe) => {
      if (recipe.missingIngredients && recipe.missingIngredients.length > 0) {
        const updatedMissingIngredients = recipe.missingIngredients.map((missingIng) => {
          return { // 각 missingIngredient 객체를 반환
            ...missingIng,
            adLink: adLinksMap.get(missingIng.id) || null, // adLinksMap 사용
          };
        });
        return {...recipe, missingIngredients: updatedMissingIngredients}; // 수정된 recipe 객체를 반환
      }
      return recipe; // 변경 없는 recipe 객체 반환
    });
    // --- 👆 .map() 콜백에서 return 추가 및 adLinksMap 사용 👆 ---

    // 최종 정렬
    recipesWithAds.sort((a, b) => {
      if (a.userInputSufficient && !b.userInputSufficient) return -1;
      if (!a.userInputSufficient && b.userInputSufficient) return 1;
      return (a.name || "").localeCompare(b.name || ""); // sort 콜백에서 값 반환
    });

    functions.logger.info("최종 레시피 목록 반환 직전 데이터:", recipesWithAds);
    return recipesWithAds;
  } catch (error) {
    functions.logger.error("메인 로직 실행 중 오류 발생:", error, {structuredData: true});
    throw new functions.https.HttpsError("internal", "레시피 검색 중 오류가 발생했습니다.");
  }
});
