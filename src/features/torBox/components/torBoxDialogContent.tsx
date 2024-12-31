import { ExternalNewAccountInput } from "@/@types/accounts";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
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
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API key"
          className="border rounded p-2"
        />
        <div className="flex gap-3 justify-end mt-3">
          <button
            onClick={handleClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </DialogContent>
  );
};

export default TorBoxDialogContent;
