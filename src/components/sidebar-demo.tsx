import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Home, Users, KanbanSquare, Calendar, FileText,
  PiggyBank, BarChart3, Building2, Zap, Sparkles, ChevronUp, Settings, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

const items = [
  { title: "Dashboard", url: "/demo/dashboard", icon: LayoutDashboard },
  { title: "Imóveis", url: "/demo/imoveis", icon: Home },
  { title: "Leads", url: "/demo/leads", icon: Users },
  { title: "Pipeline", url: "/demo/pipeline", icon: KanbanSquare },
  { title: "Visitas", url: "/demo/visitas", icon: Calendar },
  { title: "Propostas", url: "/demo/propostas", icon: FileText },
  { title: "Financeiro", url: "/demo/financeiro", icon: PiggyBank },
  { title: "Relatórios", url: "/demo/relatorios", icon: BarChart3 },
  { title: "AI Growth", url: "/demo/ai-growth", icon: Zap },
] as const;

export function SidebarDemo() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon" className="border-r border-app-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-app-border bg-sidebar">
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-sidebar-foreground tracking-tight">ImobFlow</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/60">Demo</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, i) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}
                      className="group relative h-10 rounded-lg text-sidebar-foreground/80 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold">
                      <Link to={item.url} className="relative">
                        {active && (
                          <motion.span layoutId="demo-active-bar"
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                            style={{ background: "var(--brand)" }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                        )}
                        <item.icon className={active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground transition-colors"} />
                        <span className="font-medium">{item.title}</span>
                        {item.title === "AI Growth" && (
                          <Sparkles className="ml-auto h-3 w-3 text-primary" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-app-border bg-sidebar p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors text-left"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                IE
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-sidebar-foreground truncate">Imobiliária Excellence</div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/60 truncate">Rafael · Admin</div>
                  </div>
                  <ChevronUp className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Imobiliária Excellence
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/entrar"><Settings className="h-4 w-4 mr-2" /> Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/"><LogOut className="h-4 w-4 mr-2" /> Sair do demo</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
