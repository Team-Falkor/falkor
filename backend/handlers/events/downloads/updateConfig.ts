import { DownloadQueueConfig } from "@/@types";
import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent(
  "download-queue:update-config",
  async (_event, config: Partial<DownloadQueueConfig>) => {
    downloadQueue.updateConfig(config);
    return true;
  }
);
