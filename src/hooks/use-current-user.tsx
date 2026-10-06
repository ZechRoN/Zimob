import { companyAccess } from '@/lib/domain-input';
import { useQuery } from "@tanstack/react-query";
import { callBackend } from "@/integrations/supabase/api";
import { useAuth } from "@/hooks/use-auth";

export type CurrentUserData = {
  userId: string;
  email: string;
  companyUser: any | null;
  company: any | null;
  isSuperAdmin: boolean;
  globalRoles: string[];
  trialDaysLeft: number | null;
  isSuspended: boolean;
};

export function useCurrentUser() {
  const { user, loading: authLoading } = useAuth();
  const q = useQuery({
    queryKey: ["current-user", user?.id, window.location.pathname.startsWith('/app') ? sessionStorage.getItem('imob-company') : null],
    enabled: !!user,
    queryFn: async (): Promise<CurrentUserData> => {
      const r=await callBackend('/api/bootstrap');
      const company=r.company,isSuperAdmin=r.isSuperAdmin,globalRoles=isSuperAdmin?['super_admin']:[];
      const { trialDaysLeft, isSuspended } = companyAccess(company);
      return {
        userId: user!.id,
        email: user!.email!,
        companyUser: r.companyUser,
        company,
        isSuperAdmin: !!isSuperAdmin,
        globalRoles,
        trialDaysLeft,
        isSuspended,
      };
    },
  });
  return { ...q, loading: authLoading || q.isLoading };
}
