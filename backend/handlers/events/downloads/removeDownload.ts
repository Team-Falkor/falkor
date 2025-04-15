import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent("download-queue:remove", async (_event, id: string) => {
  return downloadQueue.removeDownload(id);
});
