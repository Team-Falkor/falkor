import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent("download-queue:cancel", async (_event, id: string) => {
  return downloadQueue.cancelDownload(id);
});
