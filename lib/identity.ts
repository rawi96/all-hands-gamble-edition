import { createHash, randomBytes } from "node:crypto";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("hex");
export function validToken(value: string | undefined): value is string {
  return !!value && /^[a-f0-9]{64}$/.test(value);
}
