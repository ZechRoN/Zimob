import { useQuery } from "@tanstack/react-query";
import { callBackend } from "@/blink/backend";
import { useAuth } from "@/hooks/use-auth";

export function useCompany() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["company-user", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const r=await callBackend('/api/bootstrap');return r.companyUser?{...r.companyUser,company:r.company}:null;
    },
  });
}
