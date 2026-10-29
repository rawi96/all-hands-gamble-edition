import { z } from "zod";
import { requireHost } from "@/lib/auth";
import { createGame, listGames } from "@/lib/game";
import { body, handle, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function GET() {
  return handle(async () => {
    await requireHost();
    return listGames();
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    await requireHost();
    const { title, demo } = await body(
      request,
      z.object({
        title: z.string().trim().min(3).max(100),
        demo: z.boolean().default(false),
      }),
    );
    return createGame(title, demo);
  });
}
