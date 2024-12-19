import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to filter a keyword by name
 * @param keywordName - The name of the keyword to filter
 * @returns The Supabase query object for filtering keywords
 */
export const defineFilterKeyword = (keywordName: string) => {
  return createClient()
    .from("keywords")
    .select("*")
    .eq("name", keywordName)
    .single();
};

export type FilteredKeywords = QueryData<ReturnType<typeof defineFilterKeyword>>;

// Example Usage:
// const result = await defineAddKeyword("example-keyword");
// console.log(result);
