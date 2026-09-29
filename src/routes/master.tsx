import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarMaster } from "@/components/sidebar-master";
import { SuperAdminGuard } from "@/components/guards";

export const Route = createFileRoute("/master")({ component: () => (
  <SuperAdminGuard>
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarMaster />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-background px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger /><div className="font-semibold text-destructive">Super Admin</div>
          </header>
          <main className="flex-1 p-6 bg-surface"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  </SuperAdminGuard>
) });

