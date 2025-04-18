import { DownloadPriority } from "@/@types";
import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent(
  "download-queue:set-priority",
  async (_event, id: string, priority: DownloadPriority) => {
    return downloadQueue.setPriority(id, priority);
  }
);
