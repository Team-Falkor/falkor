import { ExternalNewAccountInput } from "@/@types/accounts";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { invoke } from "@/lib";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";
import * as auth from "../utils/auth";

interface TorBoxDialogContentProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const TorBoxDialogContent = ({ open, setOpen }: TorBoxDialogContentProps) => {
  const [apiKey, setApiKey] = useState<string>("");

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("API key cannot be empty");
      return;
    }

    try {
      const data = await auth.obtainTorBoxUser(apiKey);

      if (data) {
        const addAccount = await invoke<boolean, ExternalNewAccountInput>(
          "external-accounts:add",
          {
            access_token: apiKey.trim(), // Use API key as access_token
            type: "torbox",
            client_id: undefined,
            client_secret: undefined,
            avatar: undefined,
            email: data.email,
            username: data.email,
            refresh_token: apiKey.trim(),
            expires_in: -1,
          }
        );

        if (!addAccount) {
          toast.error("Failed to add TorBox account");
          return;
        }

        toast.success("TorBox account added successfully");
        setOpen(false);
      } else {
        toast.error("Invalid API key or failed to fetch account info");
      }
    } catch (error) {
      console.error("Failed to save TorBox account:", error);
      toast.error("An error occurred while adding the TorBox account");
    }
  };

  const handleClose = () => {
    setApiKey(""); // Reset API key input
    setOpen(false);
  };

  if (!open) return null; // Do not render the component if 'open' is false

  return (
    <DialogContent>
      <DialogTitle>TorBox</DialogTitle>
      <div className="flex flex-col gap-3">
        <p>Please enter your TorBox API key below:</p>
        <Input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API key"
          className="p-2 border rounded"
        />
        <div className="flex justify-end gap-3 mt-3">
          <Button onClick={handleClose} variant={"destructive"}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant={"success"}>
            Save
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default TorBoxDialogContent;
