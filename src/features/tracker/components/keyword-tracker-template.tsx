"use client";

import { useEffect, useState, useRef } from "react";
// actions
import { fetchKeywordTrackerWithResults } from "@/features/tracker/actions/fetch-keyword-tracker-with-results";
import { fetchTotalCount } from "@/features/tracker/actions/fetch-total-count";
import { fetchProjectsBlogs } from "@/features/tracker/actions/fetch-projects-blogs";
import { fetchBlog } from "@/features/blogs/actions/fetch-blogs";
import { fetchKeywordCategories } from "@/features/setting/actions/fetch-keyword-categories";
// components
import { KeywordTrackerHeader } from "@/features/tracker/components/keyword-tracker-header";
import { KeywordTrackerDataTable } from "@/features/tracker/components/keyword-tracker-data-table";
// types
import { Blogs } from "@/features/blogs/queries/define-fetch-blogs";
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";
import { KeywordTrackerTransformed } from "@/features/tracker/types/types";
import { getTodayInKST } from "@/utils/date";

interface KeywordTrackerTemplateProps {
  projectSlug: string;
  profileId: string;
  allDates: string[];
}

export function KeywordTrackerTemplate({
  projectSlug,
  profileId,
  allDates,
}: KeywordTrackerTemplateProps) {
  // 최초 로딩 여부
  const isFirstLoad = useRef(true);
  // Related to statistics
  const [potentialExposureByDate, setPotentialExposureByDate] = useState<
    Record<string, number> | undefined
  >({});
  const [catchCountByDate, setCatchCountByDate] = useState<
    Record<string, number> | undefined
  >({});
  const [totalKeywords, setTotalKeywords] = useState(0);
  const [todayCatchCount, setTodayCatchCount] = useState(0);

  // Related to keyword tracker data
  const [rows, setRows] = useState<KeywordTrackerTransformed[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Related to header
  const [projectBlogs, setProjectBlogs] = useState<ProjectsBlogsWithDetail[]>(
    []
  );
  const [availableBlogs, setAvailableBlogs] = useState<Blogs>([]);
  const [keywordCategories, setKeywordCategories] = useState<KeywordCategories>(
    []
  );

  useEffect(() => {
    if (!isFirstLoad.current) return;
    isFirstLoad.current = false;

    const fetchData = async () => {
      console.log("🚀 Fetching Data...");
      setLoading(true); // ✅ 데이터 로딩 시작

      try {
        const [
          projectsBlogsResult,
          blogsResult,
          categoriesResult,
          trackerResults,
          trackerResultsAll,
          totalCountResult,
        ] = await Promise.all([
          fetchProjectsBlogs(projectSlug),
          fetchBlog(profileId),
          fetchKeywordCategories(projectSlug),
          fetchKeywordTrackerWithResults({ projectSlug, offset: 0, limit: 20 }),
          fetchKeywordTrackerWithResults({ projectSlug, fetchAll: true }),
          fetchTotalCount({ projectSlug }),
        ]);

        const { potentialExposureByDate, catchCountByDate } = trackerResultsAll;

        setProjectBlogs(projectsBlogsResult ?? []);
        setAvailableBlogs(blogsResult ?? []);
        setKeywordCategories(categoriesResult ?? []);
        setRows(trackerResults.data);
        setTotalCount(trackerResults.data.length);
        setPotentialExposureByDate(potentialExposureByDate);
        setCatchCountByDate(catchCountByDate);
        setTotalKeywords(totalCountResult);

        if (catchCountByDate) {
          const today = getTodayInKST();
          setTodayCatchCount(catchCountByDate[today] ?? 0);
        }

        setLoading(false); // ✅ 데이터 로딩 완료
      } catch (error) {
        console.error("❌ Error fetching keyword tracker data:", error);
        setLoading(false); // ✅ 에러 발생 시 로딩 종료
      }
    };

    fetchData();
  }, [projectSlug, profileId]);

  return (
    <div className="overflow-auto flex flex-1 flex-col">
      <div className="flex flex-col space-y-4">
        <KeywordTrackerHeader
          projectSlug={projectSlug}
          projectBlogs={projectBlogs}
          availableBlogs={availableBlogs}
          keywordCategories={keywordCategories}
          potentialExposureByDate={potentialExposureByDate}
          catchCountByDate={catchCountByDate}
          totalKeywords={totalKeywords}
          todayCatchCount={todayCatchCount}
        />
        <KeywordTrackerDataTable
          projectSlug={projectSlug}
          allDates={allDates}
          keywordCategories={keywordCategories}
          rows={rows}
          setRows={setRows}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
