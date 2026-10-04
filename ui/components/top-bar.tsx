import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function TopBar({ dossier, title }: { dossier: string; title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-5">
      <nav className="flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
        <span className="text-muted-foreground">{dossier}</span>
        <span className="text-muted-foreground">/</span>
        <span>{title}</span>
      </nav>
      <Tooltip>
        <TooltipTrigger render={<span />}>
          <Button variant="outline" size="sm" className="h-9 rounded-lg bg-background px-3 font-normal shadow-none" disabled>
            <Upload className="size-4" /> Upload new version
          </Button>
        </TooltipTrigger>
        <TooltipContent className="font-mono text-[11px]">Live review (POST /api/review → pipeline.py) not wired yet. Versions below are precomputed.</TooltipContent>
      </Tooltip>
    </header>
  );
}
