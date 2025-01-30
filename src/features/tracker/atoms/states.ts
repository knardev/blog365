import { atom } from "recoil";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";

/**
 * 엄격 모드(Strict Mode)를 전역으로 관리하는 Recoil atom
 */
export const strictModeAtom = atom<boolean>({
  key: "strictModeState", // 전역적으로 unique해야 함
  default: false,
});

export interface BlogCardData {
  id: string;
  name: string;
  blog_slug: string;
  active: boolean;
}

// Atom for storing the optimistic state of blogs
export const blgoCardDataAtom = atom<BlogCardData[]>({
  key: "blgoCardDataAtom",
  default: [],
});

export const projectsBlogsAtom = atom<ProjectsBlogsWithDetail[]>({
  key: "projectsBlogsAtom",
  default: [],
});
