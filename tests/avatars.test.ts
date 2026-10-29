import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { avatars, avatarIds, getAvatar } from "../lib/avatars";
import { AvatarArt } from "../components/avatar-art";
test("36 distinct, original avatar drawings with compatible saved IDs", () => {
  assert.equal(avatars.length, 36);
  assert.equal(new Set(avatarIds).size, 36);
  assert.equal(new Set(avatars.map((a) => a.name)).size, 36);
  const drawings = avatars.map((a) =>
    renderToStaticMarkup(createElement(AvatarArt, { id: a.id })),
  );
  assert.equal(new Set(drawings).size, 36);
  for (const html of drawings)
    assert.ok(html.includes("<svg") && !html.includes("<image"));
  for (const id of [
    "fox",
    "unicorn",
    "shark",
    "alien",
    "frog",
    "robot",
    "fire",
    "cat",
    "ghost",
    "octopus",
    "panda",
    "rocket",
  ])
    assert.equal(getAvatar(id).id, id);
  assert.equal(getAvatar("unknown").id, "fox");
});
