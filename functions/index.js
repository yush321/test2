// functions/index.js
const functions = require("firebase-functions");
functions.logger.info("functions/index.js 파일 파싱 시작됨.", {structuredData: true}); // 파일 실행 시작 로그

const admin = require("firebase-admin");
functions.logger.info("Admin SDK 모듈 로드됨.", {structuredData: true});

// Firebase Admin SDK 초기화 (이미 초기화된 경우 중복 실행 방지)
if (admin.apps.length === 0) {
  try {
    admin.initializeApp();
    functions.logger.info("Admin SDK 초기화 완료.", {structuredData: true});
  } catch (e) {
    functions.logger.error("Admin SDK 초기화 실패!", e, {structuredData: true});
  }
} else {
  functions.logger.info("Admin SDK 이미 초기화되어 있음.", {structuredData: true});
}

const db = admin.firestore();
functions.logger.info("Firestore 인스턴스 가져옴.", {structuredData: true});

exports.findRecipes = functions
    .region("asia-northeast3") //  <- 중요: 리전을 명시적으로 지정!
    .https.onCall(async (data, context) => {
      functions.logger.info("findRecipes 함수 호출됨. 받은 데이터:", data, {structuredData: true});

      // (선택 사항) 인증된 사용자인지 확인하는 로그
      if (context.auth) {
        functions.logger.info("인증된 사용자 호출. UID:", context.auth.uid, {structuredData: true});
      } else {
      // onCall 함수는 기본적으로 인증되지 않은 요청도 허용할 수 있습니다.
      // App Check나 함수 내 로직으로 인증을 강제할 수 있습니다.
        functions.logger.info("인증되지 않은 사용자 또는 인증 컨텍스트 없음.", {structuredData: true});
      }

      const userIngredients = (data.userIngredients || []).map((ing) => ing.toLowerCase());

      if (!userIngredients || userIngredients.length === 0) {
        functions.logger.info("입력된 재료 없음. 기본 레시피 목록 반환 시도.");
        try {
          const allRecipesSnapshot = await db.collection("recipes").limit(10).get();
          const allRecipes = [];
          allRecipesSnapshot.forEach((doc) => {
            const recipeData = doc.data();
            allRecipes.push({
              id: doc.id,
              ...recipeData,
              userInputSufficient: false,
              missingIngredients: recipeData.ingredients || [],
            });
          });
          functions.logger.info("기본 레시피 목록 반환:", allRecipes, {structuredData: true});
          return allRecipes;
        } catch (error) {
          functions.logger.error("기본 레시피 조회 중 오류:", error, {structuredData: true});
          throw new functions.https.HttpsError("internal", "레시피 조회에 실패했습니다 (기본 목록).");
        }
      }

      functions.logger.info("사용자 재료 기반 레시피 검색 시작:", userIngredients, {structuredData: true});
      try {
        const recipesSnapshot = await db.collection("recipes").get();
        const matchedRecipes = [];
        recipesSnapshot.forEach((doc) => {
          const recipe = {id: doc.id, ...doc.data()};
          const recipeIngredientNames = (recipe.ingredients || []).map((ing) => ing.toLowerCase());
          let hasAtLeastOneMatch = false;
          for (const userIng of userIngredients) {
            if (recipeIngredientNames.includes(userIng)) {
              hasAtLeastOneMatch = true;
              break;
            }
          }
          if (hasAtLeastOneMatch) {
            const missingIngredients = [];
            let userInputSufficient = true;
            recipeIngredientNames.forEach((recipeIngName) => {
              if (!userIngredients.includes(recipeIngName)) {
                const originalCaseIngredient = recipe.ingredients.find((ing) => ing.toLowerCase() === recipeIngName) || recipeIngName;
                missingIngredients.push(originalCaseIngredient);
                userInputSufficient = false;
              }
            });
            matchedRecipes.push({
              ...recipe,
              userInputSufficient: userInputSufficient,
              missingIngredients: missingIngredients,
            });
          }
        });
        matchedRecipes.sort((a, b) => {
          if (a.userInputSufficient && !b.userInputSufficient) return -1;
          if (!a.userInputSufficient && b.userInputSufficient) return 1;
          return a.name.localeCompare(b.name);
        });
        functions.logger.info("검색된 레시피 반환:", matchedRecipes, {structuredData: true});
        return matchedRecipes;
      } catch (error) {
        functions.logger.error("매칭된 레시피 조회 중 오류:", error, {structuredData: true});
        throw new functions.https.HttpsError("internal", "레시피 조회에 실패했습니다 (매칭 중).");
      }
    });
