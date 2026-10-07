import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarTenant } from "@/components/sidebar-tenant";
import { TenantGuard } from "@/components/guards";
import { TrialBanner } from "@/components/trial-banner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, Search } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <TenantGuard>
      <Inner />
    </TenantGuard>
  );
}

function Inner() {
  const { data } = useCurrentUser();
  const navigate = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (data?.companyUser?.must_change_password && !loc.pathname.startsWith("/trocar-senha")) {
      navigate({ to: "/trocar-senha" });
    }
  }, [data, loc.pathname, navigate]);
  useEffect(()=>{if(data?.company?.cor_primaria)document.documentElement.style.setProperty('--color-brand',data.company.cor_primaria)},[data?.company?.cor_primaria]);
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-app-bg text-app-text">
        <SidebarTenant />
        <div className="flex-1 flex flex-col min-w-0">
          <TrialBanner trialDaysLeft={data?.trialDaysLeft ?? null} isSuspended={!!data?.isSuspended} />
          <header className="h-16 flex items-center gap-4 border-b border-app-border bg-app-bg/90 px-5 sticky top-0 z-10 backdrop-blur-md">
            <SidebarTrigger className="text-app-text-muted hover:text-primary" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] text-app-text-soft">Workspace</div>
              <div className="font-semibold tracking-tight text-app-text truncate">{data?.company?.name ?? "Zimob"}</div>
            </div>
            <div className="hidden md:block flex-1 max-w-md mx-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text-soft" />
                <input className="h-9 w-full rounded-lg border border-app-border bg-app-card pl-9 pr-3 text-sm text-app-text placeholder:text-app-text-soft focus:outline-none focus:ring-2 focus:ring-blue-500/15" placeholder="Buscar imóveis..." onKeyDown={e=>{if(e.key==="Enter")navigate({to:"/app/imoveis"})}} />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" aria-label="Preferências de notificações" onClick={()=>navigate({to:"/app/configuracoes"})} className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg border border-app-border bg-app-card text-app-text-muted hover:text-primary transition">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6 bg-app-bg min-h-0"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
