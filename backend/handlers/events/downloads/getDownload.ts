import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent("download-queue:get", async (_event, id: string) => {
  return downloadQueue.getDownload(id);
});
