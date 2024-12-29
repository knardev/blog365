import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to add a new message_targets entry
 * @param projectId - The ID of the project
 * @param phoneNumber - phoneNumber
 * @returns The Supabase query object for insertion
 */
export const defineAddMessageTargetQuery = (
  projectId: string,
  phoneNumber: string,
) => {
  return createClient()
    .from("message_targets")
    .insert({
      project_id: projectId,
      phone_number: phoneNumber,
    })
    .select();
};

export type AddMessageTarget = QueryData<
  ReturnType<typeof defineAddMessageTargetQuery>
>;
