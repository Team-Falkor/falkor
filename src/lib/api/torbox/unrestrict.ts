import { RealDebridUnrestrictFileFolder } from "@/@types/accounts";
import { TorBoxAPI } from "./models/api";

export class Unrestrict extends TorBoxAPI {
  constructor(accessToken: string) {
    super(accessToken);
  }

  public async link(
    link: string,
    password?: string,
    remote?: number
  ): Promise<RealDebridUnrestrictFileFolder> {
    const body = new URLSearchParams({ link });

    if (password) body.set("password", password);
    if (remote) body.set("remote", remote.toString());

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

  public async folder(link: string): Promise<RealDebridUnrestrictFileFolder[]> {
    const body = new URLSearchParams({ link });
    return this.makeRequest("/rest/1.0/unrestrict/folder", "POST", true, body, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }

  public async containerLink(
    link: string
  ): Promise<RealDebridUnrestrictFileFolder[]> {
    const body = new URLSearchParams({ link });
    return this.makeRequest(
      "/rest/1.0/unrestrict/containerLink",
      "POST",
      true,
      body.toString(),
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
  }
}
