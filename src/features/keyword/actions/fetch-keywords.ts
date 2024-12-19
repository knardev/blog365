"use server";

import { createClient } from "@/utils/supabase/server";
import { defineFetchKeywords } from "../queries/define-fetch-keywords";
import {  Keywords } from "../queries/define-fetch-keywords";
/**
 * Action to fetch all keywords
 * @param revalidateTargetPath - (Optional) The path to revalidate after fetching
 * @returns Array of keywords or an error if it occurs
 */
export async function fetchKeywords(): Promise<
  Keywords[] | null
> {
  // Fetch keywords using defineFetchKeywords
  const query = defineFetchKeywords();
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching keywords:", error);
    throw new Error("Failed to fetch keywords");
  }

  return data;
}
