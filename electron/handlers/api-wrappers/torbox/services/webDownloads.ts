import "@/@types/accounts/torbox";
import { TorBoxAPI } from "./api";
import {
  TorBoxResponse,
  TorBoxWebDownloadItem,
  TorBoxAddWebDownload
} from "@/@types/accounts/torbox";

export class WebDownloads extends TorBoxAPI {

    public async createWebDownload(link: string): Promise<TorBoxWebDownloadItem>{
        const body = new FormData();
        body.append("link", link);
    
        const response = await this.makeRequest<TorBoxResponse<TorBoxAddWebDownload>>(
          "webdl/createwebdownload",
          "POST",
          true,
          body
        );
    
        if (response.data) {
            const info = await this.makeRequest<TorBoxResponse<TorBoxWebDownloadItem>>(
                `webdl/mylist?id=${response.data.webdownload_id}&bypass_cache=true`,
                "GET",
                true,
                body
              );

            if (info.success && info.data) {
                return info.data;
            }
            throw new Error("TorBox: Failed to retrieve web download info");
        }
        throw new Error("TorBox: Failed to create webdownload");
    }

    public async getWebDownloadDownload(id: number): Promise<string> {
        const response = await this.makeRequest<TorBoxResponse<string>>(
            `webdl/${id}`,
            "GET",
            true
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error("TorBox: Failed to unrestrict web download");
    }

}
