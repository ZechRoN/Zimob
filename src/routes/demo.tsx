import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarDemo } from "@/components/sidebar-demo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Bell, Search } from "lucide-react";

const SEGMENT_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  imoveis: "Imóveis",
  leads: "Leads",
  pipeline: "Pipeline",
  visitas: "Visitas",
  propostas: "Propostas",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  "ai-growth": "AI Growth",
};

function DemoLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const seg = pathname.replace(/^\/demo\/?/, "").split("/")[0] || "dashboard";
  const pageTitle = SEGMENT_LABEL[seg] ?? "Dashboard";
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-app-bg text-app-text">
        <SidebarDemo />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Demo banner */}
          <div className="relative overflow-hidden border-b border-app-border bg-gradient-to-r from-blue-50 via-sky-50 to-white dark:from-app-card dark:via-app-card-2 dark:to-app-bg">
            <div className="flex items-center justify-between px-5 py-2 text-[12px]">
              <span className="flex items-center gap-2 text-primary dark:text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="font-semibold uppercase tracking-[0.2em] text-[10px]">Modo Demo</span>
                <span className="hidden sm:inline opacity-75">— dados fictícios; ações apenas demonstrativas, sem envios</span>
              </span>
              <Link to="/entrar">
                <Button size="sm" className="h-7 px-3 text-[11px] uppercase tracking-[0.15em] font-semibold bg-primary text-primary-foreground hover:bg-blue-700 border border-blue-300 dark:border-blue-800">
                  Criar conta grátis
                </Button>
              </Link>
            </div>
          </div>

          {/* Top bar */}
          <header className="h-16 flex items-center gap-4 px-5 sticky top-0 z-20 bg-app-bg/85 backdrop-blur-md border-b border-app-border">
            <SidebarTrigger className="text-app-text-muted hover:text-primary" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-[0.25em] text-app-text-soft">Zimob · Demo</span>
              <h1 className="text-lg font-semibold text-app-text tracking-tight">{pageTitle}</h1>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text-soft" />
                <input
                  placeholder="Buscar imóveis, leads, propostas…"
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-app-card border border-app-border text-sm text-app-text placeholder:text-app-text-soft focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 transition"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="Notificações"
                className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg border border-app-border bg-app-card text-app-text-muted hover:text-primary hover:border-blue-400 dark:hover:border-blue-600 transition"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 bg-app-bg"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/demo")({ component: DemoLayout });

