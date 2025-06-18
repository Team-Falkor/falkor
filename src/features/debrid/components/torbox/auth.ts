import { getTorBoxUserInstance } from "@backend/handlers/api-wrappers/torbox/services/user";

export const obtainTorBoxUser = async (api_key: string) => {
  const torBoxUser = getTorBoxUserInstance(api_key);
  return await torBoxUser.getUserInfo();
};