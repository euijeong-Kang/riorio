/**
 * 전화번호를 하이픈이 포함된 형식으로 포맷팅
 * @param phone - 포맷팅할 전화번호 (하이픈 포함/미포함 모두 가능)
 * @returns 포맷팅된 전화번호 (예: 010-1234-5678)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // 숫자만 추출
  const numbers = phone.replace(/[^\d]/g, '');
  
  // 11자리 이하로 제한
  const limited = numbers.slice(0, 11);
  
  // 길이에 따라 포맷팅
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
  }
}

