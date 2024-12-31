export type ExternalAccountType = "real-debrid" | "torbox";

export interface ExternalAccount {
  id: number;
  username: string | null;
  email: string | null;
  avatar: string | null;
  client_id: string | null;
  client_secret: string | null;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  type: ExternalAccountType;
}

export interface ExternalNewAccountInput {
  username?: string;
  email?: string;
  avatar?: string;
  client_id?: string;
  client_secret?: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  type: ExternalAccountType;
}

export interface ExternalTokenUpdateInput {
  access_token: string;
  refresh_token: string;
  expires_in: Date;
}

export type ExternalRefreshTokenFunction = (refresh_token: string) => Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: Date;
}>;

export type ExternalAccountColumn = Pick<
  ExternalAccount,
  "avatar" | "username" | "email" | "type" | "access_token" | "expires_in"
>;
