import { getRealDebridAuthInstance } from "@/lib/api/realdebrid/auth";
import { getTorBoxUserInstance } from "@/lib/api/torbox/user";

const realDebridAuth = getRealDebridAuthInstance();

export const obtainDeviceCode = async () => {
  return await realDebridAuth.obtainDeviceCode();
};

export const pollForCredentials = async (
  deviceCode: string,
  interval: number,
  expiresIn: number
) => {
  return await realDebridAuth.pollForCredentials(
    deviceCode,
    interval,
    expiresIn
  );
};

export const obtainAccessToken = async (deviceCode: string) => {
  return await realDebridAuth.obtainAccessToken(deviceCode);
};

export const obtainTorBoxUser = async (api_key: string) => {
  const torBoxUser = getTorBoxUserInstance(api_key);
  return await torBoxUser.getUserInfo();
};
