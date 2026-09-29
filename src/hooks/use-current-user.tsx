import { useQuery } from "@tanstack/react-query";
import { callBackend } from "@/blink/backend";
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
    queryKey: ["current-user", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CurrentUserData> => {
      const r=await callBackend('/api/bootstrap');
      const company=r.company,isSuperAdmin=r.isSuperAdmin,globalRoles=isSuperAdmin?['super_admin']:[];
      let trialDaysLeft: number | null = null;
      if (company?.trial_ate) {
        const diff = Math.ceil((new Date(company.trial_ate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        trialDaysLeft = diff;
      }
      const isSuspended = ["blocked","canceled"].includes(company?.status) || (company?.status==="trial" && trialDaysLeft!==null && trialDaysLeft<0);
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
