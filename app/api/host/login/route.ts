import { z } from "zod";
import { checkPassword, hash, setHostCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { body, handle, sameOrigin } from "@/lib/http";
import { ensure } from "@/lib/rules";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const { password } = await body(
      request,
      z.object({ password: z.string().max(256) }),
    );
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const result = await db().query(
      `INSERT INTO auth_attempts(key) VALUES($1)
      ON CONFLICT(key) DO UPDATE SET
        attempts=CASE WHEN auth_attempts.window_start < now()-interval '15 minutes' THEN 1 ELSE auth_attempts.attempts+1 END,
        window_start=CASE WHEN auth_attempts.window_start < now()-interval '15 minutes' THEN now() ELSE auth_attempts.window_start END
      RETURNING attempts`,
      [hash(ip)],
    );
    ensure(
      result.rows[0].attempts <= 10,
      "Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.",
      429,
    );
    ensure(checkPassword(password), "Falsches Host-Passwort.", 401);
    await setHostCookie();
    return { ok: true };
  });
}
