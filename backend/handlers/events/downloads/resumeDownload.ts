import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent("download-queue:resume", async (_event, id: string) => {
  return downloadQueue.resumeDownload(id);
});
