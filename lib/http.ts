import { z, ZodError } from "zod";
import { GameError, ensure } from "./rules";
export async function body<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  ensure(
    request.headers.get("content-type")?.includes("application/json"),
    "JSON erwartet.",
    415,
  );
  const raw = await request.text();
  ensure(raw.length <= 24000, "Anfrage zu gross.", 413);
  try {
    return schema.parse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof SyntaxError) throw new GameError("Ungültiges JSON.");
    throw error;
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  ensure(
    origin && origin === new URL(request.url).origin,
    "Ungültiger Ursprung.",
    403,
  );
}
export async function handle(fn: () => Promise<unknown>) {
  try {
    return Response.json(await fn(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof GameError)
      return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError)
      return Response.json(
        { error: error.issues[0]?.message || "Ungültige Eingabe." },
        { status: 400 },
      );
    console.error(
      error instanceof Error
        ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[database]")
        : "Unexpected error",
    );
    return Response.json(
      {
        error:
          "Serverfehler. Bitte Verbindung und Datenbank-Konfiguration prüfen.",
      },
      { status: 500 },
    );
  }
}
