"use client";

import { atom } from "recoil";
import { ProjectMenu } from "@/features/projects/types/types";

/************************************************
 * projectsAtom
 * - 전체 Project 목록을 전역 상태로 보관
 ************************************************/
export const projectsAtom = atom<ProjectMenu[]>({
  key: "projectsAtom",
  default: [],
});

/************************************************
 * currentProjectAtom
 * - 현재 선택된 Project 객체를 전역 상태로 보관
 ************************************************/
export const currentProjectAtom = atom<ProjectMenu | null>({
  key: "currentProjectAtom",
  default: null,
});

/************************************************
 * projectCategoriesAtom
 * - 현재 선택된 Project에 대한 카테고리 리스트를 보관
 ************************************************/
export type ProjectCategory = {
  id: string;
  name: string | null;
  created_at: string;
  project_id: string | null;
};

export const projectCategoriesAtom = atom<ProjectCategory[]>({
  key: "projectCategoriesAtom",
  default: [],
});
