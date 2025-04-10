import { ExternalNewAccountInput } from "@/@types/accounts";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { invoke } from "@/lib";
import { User } from "@/lib/api/realdebrid/user";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import * as auth from "../utils/auth";
import { P, TypographyMuted } from "@/components/ui/typography";

interface RealDebridDialogContentProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const RealDebridDialogContent = ({
  open,
  setOpen,
}: RealDebridDialogContentProps) => {
  const [deviceCodeInfo, setDeviceCodeInfo] = useState<{
    device_code?: string;
    user_code?: string;
    interval?: string;
    expires_in?: string;
    verification_url?: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    if (!isMounted) return;

    (async () => {
      const response = await auth.obtainDeviceCode();
      setDeviceCodeInfo(response);
      const credentials = await auth.pollForCredentials(
        response?.device_code || "",
        parseInt(response?.interval || "0"),
        parseInt(response?.expires_in || "0")
      );

      if (!credentials || !response.device_code) {
        toast.error("Failed to obtain credentials");
        setOpen(false);
        return;
      }

      const data = await auth.obtainAccessToken(response.device_code);

      if (!data) {
        toast.error("Failed to obtain access token");
        setOpen(false);
        return;
      }

      if (!data.access_token || !data.refresh_token || !data.expires_in) {
        toast.error("Failed to obtain access token");
        setOpen(false);
        return;
      }

      const rdClient = new User(data.access_token);

      const user_info = await rdClient.getUserInfo();

      if (!user_info) {
        toast.error("Failed to obtain user info");
        setOpen(false);
        return;
      }

      if (!data.refresh_token || !data.access_token || !data.expires_in) {
        toast.error("Failed to refresh access token");
        setOpen(false);
        return;
      }

      const addAccount = await invoke<boolean, ExternalNewAccountInput>(
        "external-accounts:add",
        {
          access_token: data.access_token,
          expires_in: data.expires_in,
          refresh_token: data.refresh_token,
          type: "real-debrid",
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          avatar: user_info.avatar,
          email: user_info.email,
          username: user_info.username,
        }
      );

      if (!addAccount) {
        toast.error("Failed to add account");
        setOpen(false);
        return;
      }

      toast.success("Account added successfully");
      setOpen(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [open, setOpen]);

  return (
    <DialogContent>
      <DialogTitle>Real Debrid</DialogTitle>
      <div className="flex flex-col gap-3">
        {!deviceCodeInfo ? (
          "loading..."
        ) : (
          <div className="flex flex-col gap-3">
            <P>Please go to the following URL and enter the code:</P>
            <TypographyMuted>{deviceCodeInfo.verification_url}</TypographyMuted>
            <P>Enter the code: {deviceCodeInfo.user_code}</P>
            <TypographyMuted>
              Expires in: {deviceCodeInfo.expires_in} seconds
            </TypographyMuted>
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default RealDebridDialogContent;
