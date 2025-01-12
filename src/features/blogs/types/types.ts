import { Tables } from "@/types/database.types";

export type Blog = Tables<"blogs">;

export interface BlogsWithAnalytics extends Blog {
  blog_analytics: Record<string, { daily_visitor: number }>;
  average_daily_visitors_7_days: number;
  average_daily_visitors_1_month: number;
}
