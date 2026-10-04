import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "300px" } as React.CSSProperties}>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
