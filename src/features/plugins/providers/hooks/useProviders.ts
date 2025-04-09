import { useQuery } from "@tanstack/react-query";
import { providersApi } from "../utils/api/providersApi";

export const useProviders = (params?: {
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ["providers", params],
    queryFn: () => providersApi.getProviders(params),
  });

  return {
    providers: data,
    isLoading: isLoading,
    error: error,
    isError: isError,
    refetch: refetch,
  };
};
