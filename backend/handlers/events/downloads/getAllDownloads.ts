import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent("download-queue:get-all", async () => {
  return downloadQueue.getDownloads();
});
