"use client";

import Link from "next/link";
import { FileText, Folder, HelpCircle, PanelLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { scoreTone, TONE_CLASSES } from "@/lib/review";
import { useReview } from "@/components/review-provider";

export function AppSidebar() {
  const { toggleSidebar } = useSidebar();
  const { versions, current, select } = useReview();
  const dossier = versions[0].dossier;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 pt-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span className="flex size-6 items-center justify-center rounded-sm bg-brand font-mono text-[12px] font-medium text-brand-foreground">J</span>
            JuLaw
          </Link>
          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground" aria-label="Collapse sidebar" onClick={toggleSidebar}>
            <PanelLeft className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="eyebrow px-3">Matters</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-9 rounded-lg px-3 text-[14px] font-medium">
                <Folder className="size-4 text-muted-foreground" />
                <span className="truncate">{dossier}</span>
              </SidebarMenuButton>
              <SidebarMenuSub className="mx-0 ml-4 border-l-0 px-0">
                {versions.map((v) => {
                  const active = v.version === current.version;
                  const { tone } = scoreTone(v.score.final);
                  return (
                    <SidebarMenuSubItem key={v.version}>
                      <SidebarMenuSubButton
                        isActive={active}
                        className="h-9 rounded-lg px-3 text-[14px] data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium"
                        render={<button type="button" onClick={() => select(v.version)} />}
                      >
                        <FileText className="size-4" />
                        <span className="flex-1 truncate">PV AGE — V{v.version}{v.live ? <span className="ml-1.5 rounded-sm bg-brand px-1 font-mono text-[10px] text-brand-foreground">live</span> : null}</span>
                        <span className={cn("font-mono text-[12px] tabular-nums", TONE_CLASSES[tone].text)}>{v.score.final}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="eyebrow px-3">Firm corpus</SidebarGroupLabel>
          <div className="px-3 font-mono text-[12px] leading-6 text-muted-foreground">
            <div>{current.corpus.actes} acts (greffe)</div>
            <div>{current.corpus.templates} PV templates</div>
            <div>{current.corpus.chunks} indexed units</div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="size-6"><AvatarFallback className="bg-foreground text-[11px] text-background">L</AvatarFallback></Avatar>
            <span className="text-[14px]">Léa Marchand</span>
            <span className="font-mono text-[11px] text-muted-foreground">junior</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground" aria-label="Help"><HelpCircle className="size-4" /></Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
