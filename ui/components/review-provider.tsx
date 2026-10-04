"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type Exigence, type ReviewContext, VERSIONS } from "@/lib/review";

interface ReviewState {
  versions: ReviewContext[];
  current: ReviewContext;
  select: (version: number) => void;
  review: (file: File, exigence: Exigence) => Promise<void>;
  reviewing: boolean;
  error: string | null;
}

const Ctx = createContext<ReviewState | null>(null);

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const initial = Number(useSearchParams().get("v")) || VERSIONS[VERSIONS.length - 1].version;
  const [versions, setVersions] = useState<ReviewContext[]>(VERSIONS);
  const [currentVersion, setCurrentVersion] = useState(initial);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = versions.find((v) => v.version === currentVersion) ?? versions[versions.length - 1];

  const review = useCallback(async (file: File, exigence: Exigence) => {
    setReviewing(true);
    setError(null);
    const version = Math.max(...versions.map((v) => v.version)) + 1;
    const form = new FormData();
    form.set("file", file);
    form.set("exigence", exigence);
    form.set("dossier", "helianthe");
    form.set("version", String(version));
    try {
      const res = await fetch("/api/review", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ? `${data.error}\n${data.detail}` : data.error);
      const ctx = { ...(data as ReviewContext), version, live: true } as ReviewContext & { live: boolean };
      setVersions((vs) => [...vs, ctx]);
      setCurrentVersion(version);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReviewing(false);
    }
  }, [versions]);

  const value = useMemo(() => ({ versions, current, select: setCurrentVersion, review, reviewing, error }), [versions, current, review, reviewing, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReview(): ReviewState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useReview() hors de <ReviewProvider>");
  return v;
}
