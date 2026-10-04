"use client";

import { useRef, useState } from "react";
import { ArrowUp, FileUp, PenLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReview } from "@/components/review-provider";
import type { Exigence } from "@/lib/review";

/** Barre de contexte : [+] importer un brouillon (défaut) ou demander un brouillon ; question (désactivée tant que /api/ask n'existe pas). */
export function Composer({ exigence }: { exigence: Exigence }) {
  const { importDraft, reviewing } = useReview();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent px-5 pb-4 pt-6">
      <div className="mx-auto w-full max-w-[900px] rounded-xl border bg-background p-3">
        <Textarea disabled placeholder={reviewing ? "Reviewing…" : "Ask about this review… (coming with /api/ask)"}
          className="min-h-[48px] resize-none border-0 bg-transparent px-2 text-[15px] shadow-none placeholder:text-[#8a8a8a] focus-visible:ring-0" />
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="relative">
            <Button variant="outline" size="icon" className="size-9 rounded-lg shadow-none" aria-label="Add to the workspace" aria-expanded={open}
              disabled={reviewing} onClick={() => setOpen((o) => !o)}>
              <Plus className="size-4" />
            </Button>
            {open && (
              <div role="menu" className="absolute bottom-11 left-0 z-10 w-[300px] rounded-lg border bg-background p-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                <button type="button" role="menuitem" className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
                  onClick={() => { setOpen(false); input.current?.click(); }}>
                  <FileUp className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="block text-[14px] font-medium">Import a draft</span>
                    <span className="block text-[12px] text-muted-foreground">PDF or .docx · reviewed against the firm&apos;s precedents</span>
                  </span>
                  <span className="ml-auto rounded-sm bg-lime px-1 font-mono text-[10px] text-ink">default</span>
                </button>
                <button type="button" role="menuitem" disabled className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left opacity-50">
                  <PenLine className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="block text-[14px] font-medium">Ask for a draft from a brief</span>
                    <span className="block text-[12px] text-muted-foreground">Soon</span>
                  </span>
                </button>
              </div>
            )}
            <input ref={input} type="file" accept=".pdf,.docx" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void importDraft(f, exigence); e.target.value = ""; }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-muted-foreground">strictness: {exigence}</span>
            <Button size="icon" disabled className="size-9 rounded-lg bg-lime text-ink" aria-label="Send"><ArrowUp className="size-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
