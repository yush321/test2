// src/components/MissingIngredients.js (Key 수정)
import React from 'react';

function MissingIngredients({ items }) { // items는 이제 [{ name: string, adLink: string | null }, ...] 형태의 배열
  if (!items || items.length === 0) {
    return null; // 부족한 재료가 없으면 아무것도 표시하지 않음
  }

  return (
    <div className="missing-ingredients">
      <strong>부족한 재료:</strong>
      <ul>
        {/* .map() 함수에서 index도 함께 받도록 수정 */}
        {items.map((item, index) => (
          // key prop을 이름과 인덱스를 조합하여 더 고유하게 만듦
          <li key={item.name + '-' + index}>
            {item.adLink ? (
              // 광고 링크가 있으면 링크 생성 (새 탭에서 열기)
              <a href={item.adLink} target="_blank" rel="noopener noreferrer">
                {item.name} (구매하기) {/* 예시 텍스트 */}
              </a>
            ) : (
              // 광고 링크가 없으면 이름만 표시
              item.name
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MissingIngredients;
