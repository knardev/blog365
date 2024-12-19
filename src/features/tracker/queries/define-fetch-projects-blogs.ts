import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch projects_blogs with their details
 * @param projectId - The ID of the project to fetch blogs for
 * @returns The Supabase query object
 */

export const defineFetchProjectsBlogsQuery = (projectId: string) => {
  return createClient()
    .from("projects_blogs")
    .select(`
      *,
      projects(
        id,
        name,
        slug,
        created_at
      ),
      blogs(
        id,
        name,
        blog_slug,
        owner_profile_id,
        created_at
      )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
};

// 타입 추론 적용
export type ProjectsBlogsWithDetail = QueryData<
  ReturnType<typeof defineFetchProjectsBlogsQuery>
>[number];

// 예시 데이터:
/**
 * Supabase 쿼리 결과 예시:
 * [
 *   {
 *     id: "projects-blog-1",
 *     project_id: "project-123",
 *     blog_id: "blog-456",
 *     active: true,
 *     created_at: "2024-12-15T12:00:00Z",
 *     projects: {
 *       id: "project-123",
 *       name: "Example Project",
 *       slug: "example-project",
 *       created_at: "2024-01-01T00:00:00Z"
 *     },
 *     blogs: {
 *       id: "blog-456",
 *       name: "Example Blog",
 *       slug: "example-blog",
 *       owner_profile_id: "profile-789",
 *       created_at: "2024-01-10T00:00:00Z"
 *     }
 *   },
 *   // 추가적인 projects_blogs...
 * ]
 */
