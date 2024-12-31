import { ExternalAccountType } from "@/@types/accounts";
import RealDebridClient from "@/lib/api/realdebrid";
import TorBoxClient from "@/lib/api/torbox";
import { create } from "zustand";

interface AccountsState {
  realDebrid: RealDebridClient | null;
  torBox: TorBoxClient | null;
  setRealDebrid: (access_token: string) => void;
  setTorBox: (api_key: string) => void;
  clearService: (type: ExternalAccountType) => void; // Optional: Adds ability to clear the client if needed
}

export const useAccountServices = create<AccountsState>((set) => ({
  realDebrid: null,
  torBox: null,
  accounts: [],

  setRealDebrid: (access_token: string) => {
    set((state) => {
      // Check if an instance already exists to avoid duplicate instantiation
      if (state.realDebrid) {
        console.warn("RealDebridClient is already set.");
        return state;
      }

      try {
        const client = RealDebridClient.getInstance(access_token);
        return { realDebrid: client };
      } catch (error) {
        console.error("Failed to set RealDebridClient instance:", error);
        return { realDebrid: null };
      }
    });
  },

  setTorBox: (api_key: string) => {
    set((state) => {
      // Check if an instance already exists to avoid duplicate instantiation
      if (state.torBox) {
        console.warn("TorBoxClient is already set.");
        return state;
      }

      try {
        const client = TorBoxClient.getInstance(api_key);
        return { torBox: client };
      } catch (error) {
        console.error("Failed to set TorBoxClient instance:", error);
        return { torBox: null };
      }
    });
  },

  clearService: (type) => {
    switch (type) {
      case "real-debrid":
        set(() => ({ realDebrid: null }));
        break;
      case "torbox":
        set(() => ({ torBox: null }));
        break;
      default:
        console.warn(`No service found for type ${type}`);
    }
  },
}));
