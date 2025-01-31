"use client";

import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
// atoms
import { visibleProjectsBlogsAtom } from "@/features/tracker/atoms/states";
// types
import { ProjectsBlogsWithDetail } from "@/features/tracker/queries/define-fetch-projects-blogs";
export function ShareProvider({
  initialProjectsBlogs,
}: {
  initialProjectsBlogs: ProjectsBlogsWithDetail[];
}) {
  const [visibleProjectsBlogs, setVisibleProjectsBlogs] = useRecoilState(
    visibleProjectsBlogsAtom
  );

  useEffect(() => {
    setVisibleProjectsBlogs(initialProjectsBlogs.map((pb) => pb.blog_id));
  }, [initialProjectsBlogs]);

  return null;
}
