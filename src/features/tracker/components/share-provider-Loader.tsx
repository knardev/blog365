// actions
import { fetchProjectsBlogs } from "@/features/tracker/actions/fetch-projects-blogs";
import { ShareProvider } from "./share-provider";

export async function ShareProviderLoader({
  projectSlug,
}: {
  projectSlug: string;
}) {
  const projectsBlogs = await fetchProjectsBlogs(projectSlug);

  return <ShareProvider initialProjectsBlogs={projectsBlogs ?? []} />;
}
