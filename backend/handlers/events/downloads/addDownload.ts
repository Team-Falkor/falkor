import { AddDownloadOptions } from "@/@types";
import { downloadQueue } from "../../../handlers/downloads";
import { registerEvent } from "../utils";

registerEvent(
  "download-queue:add",
  async (_event, options: AddDownloadOptions) => {
    return await downloadQueue.addDownload(options);
  }
);
