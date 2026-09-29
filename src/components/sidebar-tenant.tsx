import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Home, KanbanSquare, Calendar, FileText,
  PiggyBank, BarChart3, Sparkles, UsersRound, Settings, CreditCard, LogOut, Building2,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

const GROUPS = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
      { title: "Leads",     url: "/app/leads",     icon: Users },
      { title: "Imóveis",   url: "/app/imoveis",   icon: Home },
      { title: "Pipeline",  url: "/app/pipeline",  icon: KanbanSquare },
      { title: "Visitas",   url: "/app/visitas",   icon: Calendar },
      { title: "Propostas", url: "/app/propostas", icon: FileText },
    ],
  },
  {
    label: "Operacional",
    items: [
      { title: "Financeiro",        url: "/app/financeiro", icon: PiggyBank },
      { title: "Relatórios",        url: "/app/relatorios", icon: BarChart3 },
      { title: "AI Growth Engine",  url: "/app/ai-growth",  icon: Sparkles, badge: "IA" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Equipe",          url: "/app/equipe",         icon: UsersRound },
      { title: "Configurações",   url: "/app/configuracoes",  icon: Settings },
      { title: "Plano & Licença", url: "/app/plano",          icon: CreditCard },
    ],
  },
] as const;

export function SidebarTenant() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user } = useAuth();
  return (
    <Sidebar collapsible="icon" className="border-r border-app-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-app-border bg-sidebar">
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-sidebar-foreground tracking-tight">ImobFlow AI</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/60">CRM Pro</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar px-2 py-3">
        {GROUPS.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/55">{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => {
                  const active = pathname === it.url;
                  return (
                    <SidebarMenuItem key={it.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={it.title}
                        className="group relative h-10 rounded-lg text-sidebar-foreground/80 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold">
                        <Link to={it.url} className="relative">
                          {active && (
                            <motion.span layoutId="tenant-active-bar"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                              style={{ background: "var(--brand)" }}
                              transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                          )}
                          <it.icon className={active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground transition-colors"} />
                          <span className="flex-1 font-medium">{it.title}</span>
                          {"badge" in it && it.badge && (
                            <span className="ml-auto rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                              {it.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-app-border bg-sidebar p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1 text-[10px] text-sidebar-foreground/60 truncate">{user?.email}</div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Sair"
              className="text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent">
              <LogOut /><span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

