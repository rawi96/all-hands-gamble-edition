import { z } from "zod";
import { cookies } from "next/headers";
import {
  creatorCookie,
  creatorHash,
  creatorToken,
  cookieOptions,
  hash,
  token,
} from "@/lib/auth";
import { createGame, listGames } from "@/lib/game";
import { limitGameCreation } from "@/lib/rate-limit";
import { body, handle, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function GET() {
  return handle(async () => listGames(await creatorHash()));
}
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const { title, demo } = await body(
      request,
      z.object({
        title: z.string().trim().min(3).max(100),
        demo: z.boolean().default(false),
      }),
    );
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    await limitGameCreation(ip);
    const raw = (await creatorToken()) || token();
    const result = await createGame(title, demo, hash(raw));
    (await cookies()).set(creatorCookie, raw, cookieOptions());
    return result;
  });
}
