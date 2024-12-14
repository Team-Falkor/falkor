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

  public async folder(link: string): Promise<RealDebridUnrestrictFileFolder[]> {
    const body = new URLSearchParams({ link });
    return this.makeRequest("/rest/1.0/unrestrict/folder", "POST", true, body, {
      "Content-Type": "application/x-www-form-urlencoded",
    });
  }

  public async containerFile(
    fileId: string
  ): Promise<RealDebridUnrestrictFileFolder[]> {
    const body = new URLSearchParams({ fileId });
    return this.makeRequest(
      "/rest/1.0/unrestrict/containerFile",
      "PUT",
      true,
      body.toString(),
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
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
