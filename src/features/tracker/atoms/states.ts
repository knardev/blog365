import { atom } from "recoil";

/**
 * 엄격 모드(Strict Mode)를 전역으로 관리하는 Recoil atom
 */
export const strictModeState = atom<boolean>({
  key: "strictModeState", // 전역적으로 unique해야 함
  default: false,
});
