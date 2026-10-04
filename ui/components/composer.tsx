import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Désactivé tant que POST /api/ask (question → brique LLM avec le contexte) n'existe pas. */
export function Composer() {
  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent px-5 pb-4 pt-6">
      <div className="mx-auto w-full max-w-[900px] rounded-xl border bg-background p-3 opacity-70">
        <Textarea
          disabled
          placeholder="Ask about this review… (coming with /api/ask)"
          className="min-h-[48px] resize-none border-0 bg-transparent px-2 text-[15px] shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="font-mono text-[11px] text-muted-foreground">Answers will be grounded in this review's context.json</span>
          <Button size="icon" disabled className="size-9 rounded-lg bg-brand text-brand-foreground" aria-label="Send">
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
