import { Tables, TablesInsert } from "@/types/database.types";
import {
  KeywordAnalytics,
} from "@/features/tracker/queries/define-fetch-keyword-analytics";
import {
  KeywordTrackerResults,
} from "@/features/tracker/queries/define-fetch-keyword-tracker-result";
import {
  KeywordTrackerWithCategories,
} from "@/features/tracker/queries/define-fetch-keyword-tracker-with-catgory";

// 1. DB 기본 타입
export type KeywordTracker = Tables<"keyword_trackers">;
export type Keyword = Tables<"keywords">;
export type KeywordCategory = Tables<"keyword_categories">;
export type KeywordAnalyticsDB = Tables<"keyword_analytics">; // DB 원본
export type ProjectsBlogs = Tables<"projects_blogs">;
export type ProjectsBlogsInsert = TablesInsert<"projects_blogs">;

// 2. 추적 결과 타입
export type CatchResult = {
  post_url: string;
  smart_block_name: string;
  rank_in_smart_block: number;
};

export type DailyResult = {
  catch_success: number;
  catch_result: CatchResult[];
};

// 날짜(YYYY-MM-DD) => 해당 날짜의 결과
export type KeywordTrackerResultsMap = Record<string, DailyResult>;

// 3. 쿼리 타입 확장
export type MergedDataRow = KeywordTrackerWithCategories[number] & {
  keyword_analytics: KeywordAnalytics[number];
  raw_results: KeywordTrackerResults;
};

// 4. 최종 변환 후 데이터 타입
export type KeywordTrackerWithResults = KeywordTrackerWithCategories[number] & {
  keyword_analytics: KeywordAnalytics[number];
  keyword_tracker_results: KeywordTrackerResultsMap;
};

// 5. 추가 계산 필드 포함된 최종 타입
export type KeywordTrackerTransformed = KeywordTrackerWithCategories[number] & {
  keyword_analytics: KeywordAnalytics[number] & {
    daily_first_page_exposure?: number; // 오늘 날짜 기준 (catch_success * daily_search_volume)
  };
  keyword_tracker_results: KeywordTrackerResultsMap;
};

// 6. 잠재노출량 포함된 최종 결과 타입
export type KeywordTrackerWithResultsResponse = {
  keyword_trackers: KeywordTrackerTransformed[];
  potential_exposure: number;
  today_catch_count: number;
  week_catch_count: number;
};
