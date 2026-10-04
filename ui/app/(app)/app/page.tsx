"use client";

import { Composer } from "@/components/composer";
import { Thread } from "@/components/thread";
import { TopBar } from "@/components/top-bar";
import { useReview } from "@/components/review-provider";

export default function Page() {
  const { current } = useReview();
  return (
    <div className="flex min-h-svh flex-col">
      <TopBar />
      <main className="flex-1">
        <Thread key={current.version} ctx={current} />
      </main>
      <Composer />
    </div>
  );
}
