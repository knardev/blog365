import { Tables } from "@/types/database.types";
import { KeywordTracker } from "../queries/define-fetch-keyword-trackers";

// Define the type for keyword analytics
type KeywordAnalytics = Tables<"keyword_analytics">;

export interface KeywordTrackerWithAnalytics extends KeywordTracker {
  keyword_analytics: KeywordAnalytics | null;
}
