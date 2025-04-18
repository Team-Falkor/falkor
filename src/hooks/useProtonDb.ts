import { ProtonDBSummary } from "@/@types";
import { invoke } from "@/lib";
import { useQuery } from "@tanstack/react-query";

interface Response {
  data: ProtonDBSummary;
  success: boolean;
  error?: string;
}

export const useProtonDb = (appId: string) => {
  const getProtonDb = async (): Promise<ProtonDBSummary | null> => {
    const response = await invoke<Response>(
      "request",
      `https://www.protondb.com/api/v1/reports/summaries/${appId}.json`
    );

    if (!response?.success) return null;

    return response?.data;
  };

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["protonDb", appId],
    queryFn: getProtonDb,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!appId,
  });

  return {
    data,
    isPending,
    error,
    refetch,
  };
};
