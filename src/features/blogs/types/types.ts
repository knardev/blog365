import { Tables } from "@/types/database.types";

export type Blog = Tables<"blogs">;

export interface BlogsWithAnalytics extends Blog {
  blog_analytics: Record<string, { daily_visitor: number }>;
}