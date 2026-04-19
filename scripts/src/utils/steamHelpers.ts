// Steam utility helper functions

// Validates if a string is a valid Steam ID 64-bit format.
// Steam IDs are typically 17 digits long and start with 7656119.
// This validation is slightly flexible to account for edge cases.
// Examples: isSteamId64('76561198046029799') => true, isSteamId64('123') => false
export const isSteamId64 = (value: string): boolean => {
  // Must be all digits
  if (!/^\d+$/.test(value)) {
    return false;
  }

  // Steam IDs are typically 17 digits, but we allow 16-18 to be slightly flexible
  if (value.length < 16 || value.length > 18) {
    return false;
  }

  // Most Steam IDs start with 7656119 (this is the typical prefix)
  // But we'll be slightly flexible here to avoid false negatives
  const numValue = BigInt(value);
  const minSteamId = BigInt('76561197960265728'); // Minimum valid Steam ID
  const maxSteamId = BigInt('99999999999999999'); // Upper bound for 17-digit numbers

  return numValue >= minSteamId && numValue <= maxSteamId;
};
