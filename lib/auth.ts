import { cookies } from "next/headers";
import { db } from "./db";
import { normalizeCode } from "./rules";
import { hash, validToken } from "./identity";
export { hash, token } from "./identity";
export const creatorCookie = "betoot_creator";
export async function creatorToken() {
  const raw = (await cookies()).get(creatorCookie)?.value;
  return validToken(raw) ? raw : null;
}
export async function creatorHash() {
  const raw = await creatorToken();
  return raw ? hash(raw) : null;
}
export async function isHost(code: string) {
  const owner = await creatorHash();
  if (!owner) return false;
  return !!(
    await db().query("SELECT id FROM games WHERE code=$1 AND owner_hash=$2", [
      normalizeCode(code),
      owner,
    ])
  ).rowCount;
}
export const playerCookie = (code: string) =>
  `betoot_player_${normalizeCode(code)}`;
export async function playerHash(code: string) {
  const raw = (await cookies()).get(playerCookie(code))?.value;
  return validToken(raw) ? hash(raw) : null;
}
export function cookieOptions(maxAge = 60 * 60 * 24 * 180) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
