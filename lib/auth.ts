import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { GameError, ensure, normalizeCode } from "./rules";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("hex");
function secret() {
  ensure(
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32,
    "AUTH_SECRET muss mindestens 32 Zeichen haben.",
    503,
  );
  return process.env.AUTH_SECRET;
}
export function checkPassword(value: string) {
  ensure(
    process.env.HOST_PASSWORD && process.env.HOST_PASSWORD.length >= 12,
    "HOST_PASSWORD muss mindestens 12 Zeichen haben.",
    503,
  );
  return timingSafeEqual(
    Buffer.from(hash(value)),
    Buffer.from(hash(process.env.HOST_PASSWORD)),
  );
}
export async function setHostCookie() {
  const expires = String(Date.now() + 12 * 60 * 60 * 1000);
  const signature = createHmac("sha256", secret())
    .update(expires)
    .digest("hex");
  (await cookies()).set(
    "casino_host",
    `${expires}.${signature}`,
    cookieOptions(12 * 60 * 60),
  );
}
export async function isHost() {
  const raw = (await cookies()).get("casino_host")?.value;
  if (!raw) return false;
  const [expires, signature] = raw.split(".");
  if (
    !/^\d+$/.test(expires) ||
    !/^[a-f0-9]{64}$/.test(signature ?? "") ||
    Number(expires) < Date.now()
  )
    return false;
  const expected = createHmac("sha256", secret()).update(expires).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
export async function requireHost() {
  if (!(await isHost())) throw new GameError("Bitte als Host anmelden.", 401);
}
export const playerCookie = (code: string) =>
  `casino_player_${normalizeCode(code)}`;
export async function playerHash(code: string) {
  const raw = (await cookies()).get(playerCookie(code))?.value;
  return raw ? hash(raw) : null;
}
export function cookieOptions(maxAge = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
