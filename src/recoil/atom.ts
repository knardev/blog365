
import { atom } from "recoil";
import { LoggedInUser } from "@/features/common/types/types";

export const loggedInUserAtom = atom<LoggedInUser | null>({
  key: "loggedInUserAtom",
  default: null,
});