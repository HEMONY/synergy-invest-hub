import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/lib/db";

/** True when the signed-in user is an admin or a supervisor. */
export function useStaff() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["staff-roles", user?.id],
    queryFn: async () => ({
      admin: await hasRole(user!.id, "admin"),
      supervisor: await hasRole(user!.id, "supervisor"),
    }),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isAdmin: data?.admin ?? false,
    isSupervisor: data?.supervisor ?? false,
    isStaff: Boolean(data?.admin || data?.supervisor),
    loading: !!user && isLoading,
  };
}
