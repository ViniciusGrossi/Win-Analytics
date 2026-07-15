import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookiesService } from "@/services/bookies";

export function useBookiesQuery() {
  return useQuery({
    queryKey: ["bookies"],
    queryFn: () => bookiesService.list(),
  });
}

export function useInvalidateBookies() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["bookies"] });
}
