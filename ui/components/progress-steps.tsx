"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Progress } from "@/components/review-provider";

const STEPS: [string, string][] = [
  ["upload", "Uploading the draft"],
  ["lecture", "Reading the draft"],
  ["qualification", "Qualifying: operation, legal form, date"],
  ["grille", "Checking the expected clauses and scoring"],
  ["similaires", "Finding the closest precedents and the partner's reviews"],
  ["correction", "Rewriting the missing clauses from precedents"],
  ["feedback", "Writing the feedback"],
  ["fichier", "Building the corrected file"],
];

export function ProgressSteps({ progress, fileName }: { progress: Progress; fileName?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const idx = Math.max(0, STEPS.findIndex(([s]) => s === progress.step));
  const elapsed = Math.round((now - progress.startedAt) / 1000);
  return (
    <div className="mx-auto w-full max-w-[760px] px-5 pb-44 pt-20">
      <p className="eyebrow">Reviewing{fileName ? ` · ${fileName}` : ""}</p>
      <h1 className="mt-3 text-[28px] font-semibold leading-[1.1]">{progress.label}…</h1>
      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-brand transition-all duration-700" style={{ width: `${progress.pct}%` }} />
      </div>
      <ol className="mt-6 space-y-2">
        {STEPS.map(([s, label], i) => (
          <li key={s} className={cn("flex items-center gap-3 text-[14px]", i > idx && "text-muted-foreground")}>
            <span className={cn("flex size-5 items-center justify-center rounded-full border font-mono text-[10px]", i < idx && "border-success bg-success-surface text-success-text", i === idx && "border-brand-mid bg-brand text-white")}>
              {i < idx ? <Check className="size-3" /> : i === idx ? <Loader2 className="size-3 animate-spin" /> : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <p className="mt-6 font-mono text-[12px] text-muted-foreground">{elapsed}s elapsed · Mistral embeddings + chat, Chroma retrieval, python-docx</p>
    </div>
  );
}
