import { useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuth } from "@/hooks/use-auth";

function Loading() {
  return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
}

export function TenantGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const current = useCurrentUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/entrar" });
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (current.data && !current.data.company && pathname !== '/app/onboarding') {
      navigate({to: current.data.isSuperAdmin ? '/master/lista-imobiliarias' : '/app/onboarding'});
    }
  }, [current.data, pathname, navigate]);
  if (current.error) return <div className="p-8 space-y-4"><p role="alert">{current.error.message}</p><button onClick={()=>current.refetch()}>Tentar novamente</button><Link to="/entrar">Voltar para entrada</Link></div>;
  if (authLoading || !user || current.loading) return <Loading />;
  if (current.data?.isSuspended && !current.data.isSuperAdmin && pathname !== '/app/plano') return <div className="p-8"><p>Acesso suspenso. Entre em contato com o administrador.</p><Link to="/app/plano">Ver plano</Link></div>;
  const restricted = ['/app/financeiro','/app/comissoes','/app/relatorios'].includes(pathname);
  if (restricted && !current.data?.isSuperAdmin && !['owner','admin','financeiro'].includes(current.data?.companyUser?.role)) return <div className="p-8">Seu perfil não tem acesso a este módulo.</div>;
  if (pathname === '/app/configuracoes' && !current.data?.isSuperAdmin && !['owner','admin'].includes(current.data?.companyUser?.role)) return <div className="p-8">Somente administradores podem alterar as configurações.</div>;
  if (!current.data?.company && pathname !== '/app/onboarding') return <Loading />;
  return <>{children}</>;
}

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error, refetch } = useCurrentUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/entrar" });
    if (!loading && data && !data.isSuperAdmin) navigate({ to: "/app/dashboard" });
  }, [user, authLoading, loading, data, navigate]);
  if (error) return <div className="p-8"><p role="alert">{error.message}</p><button onClick={()=>refetch()}>Tentar novamente</button></div>;
  if (authLoading || loading || !data?.isSuperAdmin) return <Loading />;
  return <>{children}</>;
}
