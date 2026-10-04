import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { ArchitectureView } from "./architecture-view";

export const metadata: Metadata = {
  title: "The architecture — JuLaw",
  description: "How JuLaw goes from a PV to best practices: document ingestion, knowledge base, analysis agent, report and score.",
};

export default function ArchitecturePage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader active="/architecture" />
      <ArchitectureView />
    </div>
  );
}
