import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to add a new keyword
 * @param name - The name of the keyword
 * @returns The Supabase query object for insertion
 */
export const defineAddKeyword = (name: string) => {
  return createClient()
    .from("keywords")
    .insert({
      name,
    })
    .select();
};

export type AddKeyword = QueryData<ReturnType<typeof defineAddKeyword>>;

// Example Usage:
// const result = await defineAddKeyword("example-keyword");
// console.log(result);
