import { getTorBoxUserInstance } from "./user";

export const obtainTorBoxUser = async (api_key: string) => {
  const torBoxUser = getTorBoxUserInstance(api_key);
  return await torBoxUser.getUserInfo();
};