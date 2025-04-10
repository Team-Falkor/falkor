export * from "./search";

export interface APIResponse<T = unknown> {
  data: T | undefined | null;
  success: boolean;
  message: string | undefined | null;
  error: boolean;
}

export interface PluginProvider {
  id: string;
  setupUrl: string;
  setupJSON: string;
  name: string;
  offical: boolean;
  createdAt: string;
  updatedAt: string;
  approved: boolean;
}

export type PluginProviderResponse = APIResponse<Array<PluginProvider>>;
