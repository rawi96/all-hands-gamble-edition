import { isHost, playerHash } from "@/lib/auth";
import { snapshot } from "@/lib/game";
import { handle } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  return handle(async () => {
    const { code } = await context.params;
    return snapshot(
      code,
      await playerHash(code),
      new URL(request.url).searchParams.get("host") === "1" && (await isHost()),
    );
  });
}
