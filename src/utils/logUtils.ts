// utils/logUtils.ts

/**
 * 개발 환경(NODE_ENV=development)에서만 로그를 출력하는 함수
 * @param message - 로그 메시지 (첫 번째 인자)
 * @param optionalParams - 추가 로그 인자들 (선택 사항)
 */
export function devLog(message: string, ...optionalParams: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.log(message, ...optionalParams);
  }
}
