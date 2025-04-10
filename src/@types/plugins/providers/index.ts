export * from "./search";

export interface APIResponse<T = unknown> {
  data: T | undefined | null;
  success: boolean;
  message: string | undefined | null;
  error: boolean;
}

export interface Provider {
  id: string;
  setupUrl: string;
  setupJSON: string;
  name: string;
  offical: boolean;
  createdAt: string;
  updatedAt: string;
  approved: boolean;
}

export type ProvidersResponse = APIResponse<Array<Provider>>;
