"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReview } from "@/components/review-provider";

const STEPS = ["Reading the document", "Detecting the operation type", "Checking expected clauses", "Retrieving precedents and emails", "Writing the feedback"];

export function TopBar() {
  const { current, review, reviewing, error } = useReview();
  const input = useRef<HTMLInputElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!reviewing) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [reviewing]);

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(elapsed / 8))];

  return (
    <header className="flex h-14 items-center justify-between border-b px-5">
      <nav className="flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
        <span className="text-muted-foreground">{current.dossier}</span>
        <span className="text-muted-foreground">/</span>
        <span>PV AGE — V{current.version} · {current.type_operation}</span>
      </nav>
      <div className="flex items-center gap-3">
        {reviewing && (
          <span className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground" aria-live="polite">
            <Loader2 className="size-3.5 animate-spin" /> {step}… {elapsed}s
          </span>
        )}
        {error && !reviewing && (
          <span className="max-w-[420px] truncate font-mono text-[12px] text-critical-text" title={error}>{error.split("\n")[0]}</span>
        )}
        <input ref={input} type="file" accept=".pdf,.docx" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void review(f, current.exigence); e.target.value = ""; }} />
        <Button variant="outline" size="sm" className="h-9 rounded-lg bg-background px-3 font-normal shadow-none" disabled={reviewing} onClick={() => input.current?.click()}>
          <Upload className="size-4" /> Upload new version
        </Button>
      </div>
    </header>
  );
}
