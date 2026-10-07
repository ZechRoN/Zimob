import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Building2, Plus, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { ZimobBrand } from '@/components/zimob-brand'

const items = [
  { title: 'Visão geral', url: '/master/painel', icon: LayoutDashboard },
  { title: 'Imobiliárias', url: '/master/lista-imobiliarias', icon: Building2 },
  { title: 'Nova imobiliária', url: '/master/nova-imobiliaria', icon: Plus },
  { title: 'Configurações', url: '/master/configuracoes', icon: Settings },
] as const

export function SidebarMaster() {
  const pathname = useRouterState({ select: r => r.location.pathname })
  const { signOut, user } = useAuth()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const compact = state === 'collapsed' && !isMobile
  return <Sidebar collapsible="icon" className="border-r border-sidebar-border">
    <SidebarHeader className="h-24 justify-center border-b border-sidebar-border">
      <Link to="/master/painel" aria-label="Zimob — visão geral" className={compact ? "flex justify-center" : "flex flex-col gap-2 px-2"}>
        <ZimobBrand compact={compact} className={compact ? 'h-8 w-7' : 'h-10 self-start'} />
        {!compact && <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/65">Administração da plataforma</span>}
      </Link>
    </SidebarHeader>
    <SidebarContent className="py-4"><SidebarGroup><SidebarGroupLabel>GESTÃO</SidebarGroupLabel><SidebarGroupContent><SidebarMenu className="gap-1.5">
      {items.map(item => <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title} className="h-11 rounded-lg px-3 text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground">
          <Link to={item.url} onClick={() => isMobile && setOpenMobile(false)}><item.icon /><span>{item.title}</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>)}
    </SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>
    <SidebarFooter className="border-t border-sidebar-border py-4">
      {!compact && <div className="px-3 pb-3"><div className="mb-1 flex items-center gap-2 text-sm font-semibold text-sidebar-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Super administrador</div><p className="truncate text-xs text-sidebar-foreground/70" title={user?.email}>{user?.email}</p></div>}
      <SidebarMenu><SidebarMenuItem><SidebarMenuButton onClick={() => signOut()} tooltip="Sair da conta" className="h-10 px-3"><LogOut /><span>Sair da conta</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
    </SidebarFooter>
  </Sidebar>
}
