import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("open-hosting migration preserves existing games and never assigns an owner", async (t) => {
  const engine = new PGlite();
  t.after(() => engine.close());
  await engine.exec(
    await readFile(new URL("../scripts/001-init.sql", import.meta.url), "utf8"),
  );
  await engine.query(
    "INSERT INTO games(id,code,title) VALUES('11111111-1111-4111-8111-111111111111','ABC234','Existing quiz')",
  );
  const migration = await readFile(
    new URL("../scripts/002-open-hosting.sql", import.meta.url),
    "utf8",
  );
  await engine.exec(migration);
  await engine.exec(migration);
  const row = (
    await engine.query<{ title: string; owner_hash: string | null }>(
      "SELECT title,owner_hash FROM games",
    )
  ).rows[0];
  assert.equal(row.title, "Existing quiz");
  assert.equal(row.owner_hash, null);
  await engine.query("INSERT INTO rate_limits(key) VALUES('fixture-key')");
  assert.equal(
    (await engine.query("SELECT * FROM rate_limits")).rows.length,
    1,
  );
});
