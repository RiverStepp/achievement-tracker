// src/types/auth.ts
import type { User } from "./models";

export type AuthUser = User;

export interface AuthTokenResponse {
  token: string;
}
