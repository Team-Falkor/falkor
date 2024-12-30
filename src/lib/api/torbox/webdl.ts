import { TorBoxResponse } from "@/@types/accounts";
import { TorBoxAPI } from "./models/api";

export class Unrestrict extends TorBoxAPI {
  constructor(accessToken: string) {
    super(accessToken);
  }

  public async link(
    link: string,
    password?: string
  ): Promise<RealDebridUnrestrictFileFolder> {
    const body = new FormData();
    body.append("link", link);
    if (password) body.append("password", password);

    const response = await this.makeRequest<TorBoxResponse<TorBoxAddTorrent>>(
      "webdl/createwebdownload",
      "POST",
      true,
      body
    );

    if (response.data) {
      return response.data;
    }
    return null;

    if (password) body.set("password", password);

    return await this.makeRequest(
      "/rest/1.0/unrestrict/link",
      "POST",
      true,
      body.toString()
    );
  }

  public async getUrlFilename(url: string): Promise<string> {
    if (!url || url.trim() === "") {
      return "";
    }

    const uri = new URL(url);
    const response = await this.makeRequest<Response>(
      url.replace("https://storage-zip.torbox.app", "/api/torbox-zipdl"),
      "HEAD",
      false,
      undefined,
      undefined,
      true
    );

    const contentDisposition = response.headers.get("Content-Disposition");

    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+?)"/);
      if (matches && matches[1]) {
        return matches[1].trim();
      }
    }

    const path = uri.pathname.split("/").pop() || "";
    return decodeURIComponent(path.split("?")[0]);
  }
}
