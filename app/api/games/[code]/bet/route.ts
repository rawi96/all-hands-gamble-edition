import { z } from "zod";
import { playerHash } from "@/lib/auth";
import { placeBet } from "@/lib/game";
import { body, handle, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  return handle(async () => {
    sameOrigin(request);
    const { code } = await context.params;
    const { option, stake } = await body(
      request,
      z.object({
        option: z.number().int().min(0).max(3),
        stake: z.number().int().min(1).max(2147483647),
      }),
    );
    return placeBet(code, await playerHash(code), option, stake);
  });
}
