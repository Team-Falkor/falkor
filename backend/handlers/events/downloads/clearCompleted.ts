import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent("download-queue:clear-completed", async () => {
  return downloadQueue.clearCompletedDownloads();
});
