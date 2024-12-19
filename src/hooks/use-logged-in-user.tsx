"use client";

import { useRecoilValue } from "recoil";
import { loggedInUserAtom } from "@/recoil/atom";
import { LoggedInUser } from "@/features/common/types/types";

/**
 * Custom hook to get the profileId from Recoil state
 */
export function useLoggedInUser(): LoggedInUser | null {
  return useRecoilValue(loggedInUserAtom);
}
