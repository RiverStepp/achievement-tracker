export function isHandle(value: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

export function isSteamId64(value: string): boolean {
  return /^[0-9]{17}$/.test(value);
}

export function isHttpsUrl(value: string): boolean {
  return /^https:\/\//.test(value);
}

export function isBio(value: string): boolean {
  return value.length <= 280;
}

export function nonEmpty(value: string): boolean {
  return Boolean(value && value.trim().length > 0);
}
