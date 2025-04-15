import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent("download-queue:pause", async (_event, id: string) => {
  return downloadQueue.pauseDownload(id);
});
