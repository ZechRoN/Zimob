import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, LayoutDashboard, ListChecks, Plus, LogOut, Settings } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { title: "Painel", url: "/master/painel", icon: LayoutDashboard },
  { title: "Imobiliárias", url: "/master/lista-imobiliarias", icon: ListChecks },
  { title: "Nova imobiliária", url: "/master/nova-imobiliaria", icon: Plus },
  { title: "Configurações", url: "/master/configuracoes", icon: Settings },
] as const;

export function SidebarMaster() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user } = useAuth();
  return (
    <Sidebar collapsible="icon" style={{ ["--sidebar" as any]: "oklch(0.35 0.18 25)" }}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 rounded-md bg-app-card/15 text-primary-foreground flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-semibold text-primary-foreground">Super Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon /><span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1 text-xs text-primary-foreground/70 truncate">{user?.email}</div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Sair">
              <LogOut /><span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
