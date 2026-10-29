import { z } from "zod";
import { cookies } from "next/headers";
import {
  cookieOptions,
  hash,
  playerCookie,
  playerHash,
  token,
} from "@/lib/auth";
import { avatarIds } from "@/lib/avatars";
import { joinGame } from "@/lib/game";
import { body, handle, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  return handle(async () => {
    sameOrigin(request);
    const { code } = await context.params;
    const { name, avatar } = await body(
      request,
      z.object({
        avatar: z
          .string()
          .refine(
            (v) => avatarIds.includes(v as (typeof avatarIds)[number]),
            "Ungültiger Avatar.",
          ),
        name: z
          .string()
          .trim()
          .min(2)
          .max(24)
          .regex(
            /^[\p{L}\p{N} ._'-]+$/u,
            "Bitte Buchstaben und Zahlen verwenden.",
          ),
      }),
    );
    const secret = token();
    const result = await joinGame(
      code,
      name,
      hash(secret),
      await playerHash(code),
      avatar,
    );
    if (!result.resumed)
      (await cookies()).set(playerCookie(code), secret, cookieOptions());
    return { ok: true };
  });
}
