import { TorBoxResponse, TorBoxUser } from "@/@types/accounts";
import { TorBoxAPI } from "./api";

export class User extends TorBoxAPI {
  constructor(api_key: string) {
    super(api_key);
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

let instance: User | null = null;

export const getTorBoxUserInstance = (api_key: string): User => {
  if (!instance) {
    instance = new User(api_key);
  }
  return instance;
};