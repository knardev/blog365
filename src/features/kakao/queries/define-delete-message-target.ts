import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Define the query to delete a message_targets entry
 * @param projectId - The ID of the project
 * @param phoneNumber - phoneNumber
 * @returns The Supabase query object for deletion
 */
export const defineDeleteMessageTargetQuery = (
  projectId: string,
  phoneNumber: string,
) => {
  return createClient()
    .from("message_targets")
    .delete()
    .match({
      project_id: projectId,
      phone_number: phoneNumber,
    })
    .select();
};

export type DeleteMessageTarget = QueryData<
  ReturnType<typeof defineDeleteMessageTargetQuery>
>;
