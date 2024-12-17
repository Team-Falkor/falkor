import { getRealDebridAuthInstance } from "@/lib/api/realdebrid/auth";

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
