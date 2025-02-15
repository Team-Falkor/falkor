import { DownloadgameData, DownloadStatus } from "@/@types";
import { invoke } from "@/lib";
import { useState } from "react";
import { toast } from "sonner";

interface DownloadPauseReturn {
  message: string;
  error: boolean;
  success: boolean;
  data: { id: string; status: DownloadStatus; game_data: DownloadgameData };
}

export const UseDownloadAction = (id?: string) => {
  const [status, setStatus] = useState<DownloadStatus | null>(null);

  const pause = async () => {
    if (!id) return null;

    const data = await invoke<DownloadPauseReturn, string>("queue:pause", id);

    if (!data?.success) {
      toast.error(id, { description: "failed to pause download" });
      return null;
    }
    if (data?.error) {
      toast.error(data.message);
      return null;
    }

    window.ipcRenderer.on("queue:pause", () => {
      console.log("paused");
    });

    setStatus("paused");
    return data;
  };

  const start = async () => {
    if (!id) return null;

    const data = await invoke<DownloadPauseReturn, string>("queue:resume", id);

    if (!data?.success) return null;
    if (data.error) {
      toast.error(data.message);
      return null;
    }

    // Assuming "downloading" is a valid status within DownloadStatus
    setStatus("downloading");
    return data;
  };

  const stop = async () => {
    if (!id) return null;

    const data = await invoke<DownloadPauseReturn, string>("queue:stop", id);

    if (!data?.success) return null;
    if (data.error) {
      toast.error(data.message);
      return null;
    }

    // Assuming "stopped" is a valid status within DownloadStatus
    setStatus("stopped");
    return data;
  };

  return { pause, start, stop, status };
};
