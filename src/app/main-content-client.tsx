"use client";

import dynamic from "next/dynamic";

export const MainContentClient = dynamic(
  () => import("./main-content").then((mod) => ({ default: mod.MainContent })),
  { ssr: false }
);
