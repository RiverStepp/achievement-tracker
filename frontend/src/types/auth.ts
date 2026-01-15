import { User } from "./models";

export type AuthUser = User;

export type AuthTokenResponse = {
  token: string; // JWT
};