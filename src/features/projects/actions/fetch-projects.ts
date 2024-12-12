"use server";

import { defineFetchProjectQuery } from "@/features/projects/queries/define-fetch-projects";
import { Tables } from "@/types/database.types";


/**
 * Action to fetch the project 
 * @param profileId - The ID of the profile to fetch the project for
 * @returns The fetched project
 */

type Project = Tables<"projects">;

export async function fetchProjects(
  profileId: string
): Promise<Project[]> {
  const query = await defineFetchProjectQuery(profileId);

  const { data, error } = query;

  if (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects");
  }

  return data;
}
