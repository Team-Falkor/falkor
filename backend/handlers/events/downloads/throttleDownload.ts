import { torrentDownloadHandler } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent("torrent:throttle-download", async (_event, speed: number) => {
  torrentDownloadHandler.updateThrottling(speed);
  return true;
});
