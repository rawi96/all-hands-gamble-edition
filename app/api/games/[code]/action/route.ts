import { z } from "zod";
import { requireHost } from "@/lib/auth";
import { hostAction, roundSchema } from "@/lib/game";
import { body, handle, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  return handle(async () => {
    sameOrigin(request);
    await requireHost();
    const { code } = await context.params;
    const input = await body(
      request,
      z.object({
        action: z.enum([
          "add",
          "edit",
          "delete",
          "open",
          "lock",
          "reveal",
          "finish",
        ]),
        roundId: z.uuid().optional(),
        data: roundSchema.optional(),
      }),
    );
    return hostAction(code, input.action, input.roundId, input.data);
  });
}
