import { playerHash } from "@/lib/auth";
import { bailout } from "@/lib/game";
import { handle, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  return handle(async () => {
    sameOrigin(request);
    const { code } = await context.params;
    return bailout(code, await playerHash(code));
  });
}
