import { ExternalAccount, ExternalTokenUpdateInput } from "@/@types/accounts";
import { invoke } from "@/lib";
import { getRealDebridAuthInstance } from "@/lib/api/realdebrid/auth";
import { useAccountServices } from "@/stores/account-services";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export const useAppStartup = () => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const navigate = useNavigate();
  const { setRealDebrid, realDebrid, setTorBox, torBox } = useAccountServices();

  const { data, isPending, error, isError } = useQuery({
    queryKey: ["accounts", "all"],
    queryFn: async () => {
      if (realDebrid) return [];
      const data = invoke<Array<ExternalAccount>, string | undefined>(
        "external-accounts:get-all"
      );

      return data;
    },
  });

  const setRD = useCallback(async () => {
    if (!data) return;
    if (realDebrid) return;

    const rd = data.find(
      (account: ExternalAccount) => account.type === "real-debrid"
    );
    if (!rd || !rd.access_token) return;

    // Convert `expires_in` from seconds to milliseconds
    const expiresInMs = rd.expires_in + 100000;

    const now = Math.floor(new Date().getTime());

    if (expiresInMs < now) {
      console.log("Access token expired, refreshing...");

      const auth = getRealDebridAuthInstance();

      auth.accessToken = rd.access_token;
      auth.refreshToken = rd.refresh_token;
      auth.clientId = rd.client_id!;
      auth.clientSecret = rd.client_secret!;

      const { access_token, refresh_token, expires_in } =
        await auth.refreshAccessToken();

      if (!access_token || !refresh_token || !expires_in) return;

      const input: ExternalTokenUpdateInput = {
        access_token: access_token!,
        refresh_token: refresh_token!,
        expires_in: new Date(Date.now() + expires_in / 1000), // Convert seconds to milliseconds here
      };

      await invoke<boolean>(
        "external-accounts:update",
        rd.email,
        input,
        rd.type
      );

      rd.access_token = access_token!;
      rd.refresh_token = refresh_token!;
      rd.expires_in = expires_in! * 1000; // Update `expires_in` to milliseconds
      setRealDebrid(rd.access_token);

      console.log("Access token refreshed successfully");

      return;
    }

    console.log("Found RealDebrid account:");
    setRealDebrid(rd.access_token);
  }, [data, realDebrid, setRealDebrid]);

  const setTB = useCallback(async () => {
    if (!data) return;
    if (torBox) return;

    const tb = data.find(
      (account: ExternalAccount) => account.type === "torbox"
    );
    if (!tb || !tb.access_token) return;

    try {
      setTorBox(tb.access_token);
      console.log("TorBox initialized successfully");
    } catch (error) {
      console.error("Failed to initialize TorBox:", error);
    }
  }, [data, torBox, setTorBox]);

  useEffect(() => {
    if (isPending) return;

    if (isError) {
      console.error("Error fetching accounts:", error);
      return;
    }

    if (!data) {
      console.error("No accounts found");
      return;
    }

    setRD();
    setTB();
    setHasLoaded(true);
  }, [data, isPending, isError, setRD, setTB, error]);

  useEffect(() => {
    window.ipcRenderer.on("app:deep-link", async (_event, url: string) => {
      const deepLinkContent = url?.split("falkor://")?.[1];
      const command = deepLinkContent?.split("/")?.[0];
      const args = deepLinkContent?.split("/")?.slice(1);

      if (!command) return;
      if (command === "install-plugin" && args.length) {
        const url = args.join("/");

        if (!url.includes("setup.json")) return;

        const installed = await invoke<
          { message: string; success: boolean },
          string
        >("plugins:install", url);
        if (!installed?.success) {
          toast.error(installed?.message ?? null);
          return;
        }

        toast.success(installed?.message ?? null);
      }

      if (command === "goto" && args.length) {
        const url = args.join("/").startsWith("/")
          ? args.join("/")
          : `/${args.join("/")}`;
        if (!url) return;
        navigate({
          to: url,
          replace: false,
          resetScroll: true,
        });
        return;
      }

      setHasLoaded(true);
    });

    return () => {
      window.ipcRenderer.removeAllListeners("app:deep-link");
    };
  }, [navigate]);

  return {
    hasLoaded,
  };
};
