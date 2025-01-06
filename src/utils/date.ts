/**
 * 한국 시간(KST) 기준 '어제'의 YYYY-MM-DD 문자열을 반환
 * @returns {string} 'YYYY-MM-DD'
 */
export function getYesterdayInKST(): string {
  // 1) 현재 시각(밀리초)
  const nowMs = Date.now();
  // 2) 한국(KST=UTC+9) 시간으로 변환: nowMs + 9시간
  const kstTime = new Date(nowMs + 9 * 60 * 60 * 1000);

  // kstTime에는 시·분·초, 월, 일, 연도 등이 한국 시간대에 맞춰져 있음.
  // 예: 만약 now가 UTC 기준 2023-10-05T00:00:00면,
  //     kstTime은 2023-10-05T09:00:00 (여기서 .toISOString()하면 여전히 UTC 표기로 보이지만,
  //     내부 필드상 '연도/월/일'은 KST 기준 10/05임)

  // 3) '날짜'만 1 감소 (시/분/초는 그대로 유지)
  //    setDate()는 1일 감소 시, 월·연도가 바뀌면 자동으로 그 전 달/연도로 넘어감
  kstTime.setDate(kstTime.getDate() - 1);

  // 4) 최종적으로 "YYYY-MM-DD" 형태로 반환
  return kstTime.toISOString().split("T")[0];
}

export function getTodayInKST(): string {
  // 1) 현재 시각(밀리초)
  const nowMs = Date.now();
  // 2) 한국(KST=UTC+9) 시간으로 변환: nowMs + 9시간
  const kstTime = new Date(nowMs + 9 * 60 * 60 * 1000);

  // kstTime에는 시·분·초, 월, 일, 연도 등이 한국 시간대에 맞춰져 있음.
  // 예: 만약 now가 UTC 기준 2023-10-05T00:00:00면,
  //     kstTime은 2023-10-05T09:00:00 (여기서 .toISOString()하면 여전히 UTC 표기로 보이지만,
  //     내부 필드상 '연도/월/일'은 KST 기준 10/05임)

  // 3) 최종적으로 "YYYY-MM-DD" 형태로 반환
  return kstTime.toISOString().split("T")[0];
}
