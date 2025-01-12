"use client";

import { atom } from "recoil";
import { ProjectMenu } from "@/features/projects/types/types";

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
