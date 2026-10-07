import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {Outlet,createRootRouteWithContext,HeadContent} from '@tanstack/react-router';
import {AuthProvider} from '@/hooks/use-auth';
import {ThemeProvider} from '@/hooks/use-theme';
import {Toaster} from '@/components/ui/sonner';
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({component:Root,notFoundComponent:()=> <div className="p-12 text-center">Página não encontrada</div>});
function Root(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><ThemeProvider><AuthProvider><HeadContent/><Outlet/><Toaster richColors position="top-right"/></AuthProvider></ThemeProvider></QueryClientProvider>}
