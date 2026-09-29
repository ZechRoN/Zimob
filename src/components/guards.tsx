import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuth } from "@/hooks/use-auth";

function Loading() {
  return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
}

export function TenantGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/entrar" });
  }, [user, authLoading, navigate]);
  if (authLoading || !user) return <Loading />;
  return <>{children}</>;
}

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data, loading } = useCurrentUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/entrar" });
    if (!loading && data && !data.isSuperAdmin) navigate({ to: "/app/dashboard" });
  }, [user, authLoading, loading, data, navigate]);
  if (authLoading || loading || !data?.isSuperAdmin) return <Loading />;
  return <>{children}</>;
}
