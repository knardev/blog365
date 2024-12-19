import { Tables, TablesInsert } from "@/types/database.types";

type KeywordTracker = Tables<"keyword_trackers">;
type Keyword = Tables<"keywords">;
type KeywordCategory = Tables<"keyword_categories">;
type KeywordAnalytics = Tables<"keyword_analytics">;
type ProjectsBlogs = Tables<"projects_blogs">
export type ProjectsBlogsInsert = TablesInsert<"projects_blogs">

export interface CatchResult {
  post_url: string;
  rank_in_smart_block: number;
}

export interface DailyResult {
  catch_success: number;
  catch_result: CatchResult[];
}

export type KeywordTrackerResultsMap = Record<string, DailyResult>;

export interface KeywordWithAnalytics extends Keyword {
}

export interface KeywordTrackerWithResults extends KeywordTracker {
  keywords: Keyword | null;
  keyword_analytics: KeywordAnalytics | null;
  keyword_categories: KeywordCategory | null;
  keyword_tracker_results: KeywordTrackerResultsMap;
}