import { cookies } from "next/headers";
import { handle, sameOrigin } from "@/lib/http";
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    (await cookies()).delete("casino_host");
    return { ok: true };
  });
}
