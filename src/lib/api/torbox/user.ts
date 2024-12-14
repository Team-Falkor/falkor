import { TorBoxResponse, TorBoxUser } from "@/@types/accounts";
import { TorBoxAPI } from "./models/api";

export class User extends TorBoxAPI {
  constructor(accessToken: string) {
    super(accessToken);
  }

  public async getUserInfo(): Promise<TorBoxUser | null> {
    const response = await this.makeRequest<TorBoxResponse<TorBoxUser>>(
      "user/me?settings=false",
      "GET",
      true
    );
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }
}
