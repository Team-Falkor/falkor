import { invoke } from "@/lib";
import { useEffect, useState } from "react";
import Confirmation from "./confirmation";

const ConfirmClose = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClose = () => {
    invoke("app:close", true);
  };

  useEffect(() => {
    window.ipcRenderer.on(
      "close-confirm",
      (_event, { message }: { message: string }) => {
        setMessage(message);
        setOpen(true);
      }
    );

    return () => {
      window.ipcRenderer.removeAllListeners("close-confirm");
    };
  }, []);

  if (!message) return null;
  return (
    <Confirmation
      onConfirm={handleClose}
      onOpenChange={setOpen}
      open={open}
      title={"Close App?"}
      description={`Are you sure you want to close the app? you have ${message}`}
    />
  );
};

export default ConfirmClose;
