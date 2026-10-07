import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarMaster } from "@/components/sidebar-master";
import { SuperAdminGuard } from "@/components/guards";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/master")({ component: () => (
  <SuperAdminGuard>
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarMaster />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 shrink-0 flex items-center border-b bg-background px-4 sm:px-8 gap-3 sticky top-0 z-10">
            <SidebarTrigger aria-label="Abrir ou recolher menu" /><div className="flex-1"><div className="font-semibold">Central de administração</div><p className="hidden sm:block text-xs text-muted-foreground mt-1">Imobiliárias, acessos e configurações da Zimob</p></div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Acesso Master</span><ThemeToggle />
          </header>
          <main className="flex-1 min-w-0 bg-surface px-4 py-6 sm:p-8 lg:p-10"><div className="mx-auto w-full max-w-7xl"><Outlet /></div></main>
        </div>
      </div>
    </SidebarProvider>
  </SuperAdminGuard>
) });

