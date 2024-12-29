import { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { TablesUpdate } from "@/types/database.types";
/**
 * Define the query to update a message_targets entry
 * @param projectId - The ID of the project
 * @param phoneNumber - phoneNumber
 * @param updates - The updates to apply (e.g., active: boolean)
 * @returns The Supabase query object for update
 */
export const defineUpdateMessageTargetQuery = (
  projectId: string,
  phoneNumber: string,
  updates: TablesUpdate<"message_targets">,
) => {
  return createClient()
    .from("message_targets")
    .update(updates)
    .match({
      project_id: projectId,
      phone_number: phoneNumber,
    })
    .select();
};

export type UpdateMessageTarget = QueryData<
  ReturnType<typeof defineUpdateMessageTargetQuery>
>;
