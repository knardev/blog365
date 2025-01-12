import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to fetch a project
 * @param  - The slug of project to check for
 * @returns Supabase query to fetch the project
 */
export const defineCheckProjectSlugQuery = async (slug: string) => {
  const query = createClient()
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("slug", slug);

  return query;
};

// Type for the query result
export type CheckProjectSlug = QueryData<
  ReturnType<typeof defineCheckProjectSlugQuery>
>;
