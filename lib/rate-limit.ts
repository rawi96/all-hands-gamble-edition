import { db } from "./db";
import { hash } from "./identity";
import { ensure } from "./rules";
export async function limitGameCreation(ip: string) {
  const result = await db().query(
    `INSERT INTO rate_limits(key) VALUES($1)
    ON CONFLICT(key) DO UPDATE SET
      attempts=CASE WHEN rate_limits.window_start < now()-interval '15 minutes' THEN 1 ELSE rate_limits.attempts+1 END,
      window_start=CASE WHEN rate_limits.window_start < now()-interval '15 minutes' THEN now() ELSE rate_limits.window_start END
    RETURNING attempts`,
    [hash(`create:${ip}`)],
  );
  ensure(
    result.rows[0].attempts <= 10,
    "Du hast gerade viele Spiele erstellt. In 15 Minuten geht es weiter.",
    429,
  );
}
