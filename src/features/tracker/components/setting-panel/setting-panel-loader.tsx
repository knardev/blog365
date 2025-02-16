// components
import { ProjectsBlogsSheet } from "@/features/tracker/components/setting-panel/projects-blogs-sheet";
import { KeywordTrackerAddSheet } from "@/features/tracker/components/setting-panel/keyword-tracker-add-sheet";
import { StrictModeSwitch } from "@/features/tracker/components/setting-panel/strict-mode-switch";
import { ClipboardShareButton } from "@/features/tracker/components/setting-panel/clipboard-share-button";
import { RefreshButton } from "@/features/tracker/components/setting-panel/refresh-button";
// actions
import { fetchProjectsBlogs } from "@/features/tracker/actions/fetch-projects-blogs";
import { fetchBlog } from "@/features/blogs/actions/fetch-blogs";
// types
import { KeywordCategories } from "@/features/setting/queries/define-fetch-keyword-categories";

export async function SettingPanelLoader({
  projectSlug,
  profileId,
  categoriesResult,
}: {
  projectSlug: string;
  profileId: string;
  categoriesResult: KeywordCategories;
}) {
  const shareLink = `${process.env.NEXT_PUBLIC_SITE_URL}/share/${projectSlug}`;

  console.log("🚀 Fetching Projects Blogs...");
  const fetchStartTime = performance.now();

  try {
    const [projectsBlogs, blogs] = await Promise.all([
      fetchProjectsBlogs(projectSlug),
      fetchBlog(profileId),
    ]);

    console.log(
      `✅ Projects Blogs Loaded (Duration: ${
        performance.now() - fetchStartTime
      } ms)`
    );

    return (
      <div className="flex justify-between items-center">
        <StrictModeSwitch />
        <div className="flex gap-2">
          <RefreshButton projectSlug={projectSlug} />
          <ClipboardShareButton shareLink={shareLink} />
          <ProjectsBlogsSheet
            projectSlug={projectSlug}
            initialAvailableBlogs={blogs}
            initialProjectsBlogs={projectsBlogs ?? []}
          />
          <KeywordTrackerAddSheet
            projectSlug={projectSlug}
            keywordCategories={categoriesResult ?? []}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Error fetching Projects Blogs:", error);
    return <p>⚠️ Failed to load project blogs.</p>;
  }
}
