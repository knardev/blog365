"use client";

import * as React from "react";
import { useState } from "react";
import { BlogAddSheet } from "./blog-add-sheet";

export function BlogTableHeader({ profileId }: { profileId: string }) {
  const [openSheet, setOpenSheet] = useState(false);

  return (
    <div className="flex items-center justify-end w-full gap-2 p-2">
      <BlogAddSheet
        profileId={profileId}
        revalidateTargetPath={`/blogs`}
        openSheet={openSheet}
        setOpenSheet={setOpenSheet}
      />
    </div>
  );
}
