import { ExternalAccountType } from "@/@types/accounts";
import RealDebridClient from "@/lib/api/realdebrid";
import TorBoxClient from "@/lib/api/torbox";
import { create } from "zustand";

interface AccountsState {
  realDebrid: RealDebridClient | null;
  torBox: TorBoxClient | null;
  loading: boolean;
  error: string | null;
  setRealDebrid: (access_token: string) => Promise<void>;
  setTorBox: (api_key: string) => Promise<void>;
  clearService: (type: ExternalAccountType) => void;
  getServiceStatus: (type: ExternalAccountType) => { isConnected: boolean; client: RealDebridClient | TorBoxClient | null };
}

export const useAccountServices = create<AccountsState>((set): AccountsState => ({
  realDebrid: null,
  torBox: null,
  loading: false,
  error: null,

  setRealDebrid: async (access_token: string) => {
    set({ loading: true, error: null });
    try {
      const client = RealDebridClient.getInstance(access_token);
      set({ realDebrid: client, loading: false });
      localStorage.setItem('realDebridToken', access_token);
    } catch (error) {
      console.error("Failed to set RealDebridClient instance:", error);
      set({ error: "Failed to connect to Real-Debrid", loading: false, realDebrid: null });
    }
  },

  setTorBox: async (api_key: string) => {
    set({ loading: true, error: null });
    try {
      const client = TorBoxClient.getInstance(api_key);
      set({ torBox: client, loading: false });
      localStorage.setItem('torBoxApiKey', api_key);
    } catch (error) {
      console.error("Failed to set TorBoxClient instance:", error);
      set({ error: "Failed to connect to TorBox", loading: false, torBox: null });
    }
  },

  clearService: (type) => {
    switch (type) {
      case "real-debrid":
        localStorage.removeItem('realDebridToken');
        set(() => ({ realDebrid: null, error: null }));
        break;
      case "torbox":
        localStorage.removeItem('torBoxApiKey');
        set(() => ({ torBox: null, error: null }));
        break;
      default:
        console.warn(`No service found for type ${type}`);
    }
  },

  getServiceStatus: (type) => {
    switch (type) {
      case "real-debrid":
        return { isConnected: !!useAccountServices.getState().realDebrid, client: useAccountServices.getState().realDebrid };
      case "torbox":
        return { isConnected: !!useAccountServices.getState().torBox, client: useAccountServices.getState().torBox };
      default:
        return { isConnected: false, client: null };
    }
  },
}));
