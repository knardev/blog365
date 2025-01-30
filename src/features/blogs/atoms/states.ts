import { atom } from "recoil";

import { BlogsWithAnalytics } from "@/features/blogs/types/types";

export const blogsWithAnalyticsAtom = atom<BlogsWithAnalytics[]>({
  key: "blogsWithAnalyticsAtom",
  default: [],
});
