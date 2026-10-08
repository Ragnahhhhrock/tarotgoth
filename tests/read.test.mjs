import assert from "node:assert/strict";
import { onRequestPost, onRequest, cleanResult } from "../functions/api/read.js";

const b64 = "A".repeat(400);
const mk = (body, headers = {}) => new Request("https://tarotgoth.com/api/read", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
const env = { ANTHROPIC_API_KEY: "test" };

// method guard
assert.equal((await onRequest()).status, 405);
// config guard
assert.equal((await onRequestPost({ request: mk({}), env: {} })).status, 503);
// origin guard
assert.equal((await onRequestPost({ request: mk({}, { origin: "https://evil.example" }), env })).status, 403);
// bad image
assert.equal((await onRequestPost({ request: mk({ image: "x", mediaType: "image/jpeg" }), env })).status, 400);
assert.equal((await onRequestPost({ request: mk({ image: b64, mediaType: "text/html" }), env })).status, 400);

// happy path with mocked upstream
let sent;
globalThis.fetch = async (url, init) => {
  sent = JSON.parse(init.body);
  return new Response(JSON.stringify({ content: [{ type: "tool_use", name: "deliver_reading", input: {
    status: "ok", spread: { name: "Three-card spread", card_count: 3 },
    cards: [{ name: "The Tower", short: "XVI", position: "Future", orientation: "reversed" }],
    verdict: "Bad news, nicely arranged.", sections: [{ card: "The Tower", position: "Future", text: "Boom." }], close: "Wear black."
  } }] }), { status: 200 });
};
const ok = await onRequestPost({ request: mk({ image: b64, mediaType: "image/jpeg", question: "Will it work?" }, { origin: "https://tarotgoth.com" }), env });
assert.equal(ok.status, 200);
const out = await ok.json();
assert.equal(out.cards[0].orientation, "reversed");
assert.equal(sent.tool_choice.type, "auto");
assert.equal(sent.tools[0].name, "deliver_reading");
assert.match(sent.messages[0].content[1].text, /Will it work/);

// sanitiser
assert.equal(cleanResult({ status: "ok", verdict: "x", cards: [] }).status, "unreadable");
assert.equal(cleanResult({ status: "no_cards", verdict: "Just a cat." }).status, "no_cards");
const care = cleanResult({ status: "ok", needs_care: true, verdict: "I'm here.", cards: [{ name: "x" }] });
assert.equal(care.needs_care, true); assert.equal(care.cards, undefined);

// rate limit with fake KV
const store = new Map();
const RATE = { get: async (k) => store.get(k), put: async (k, v) => void store.set(k, v) };
const lim = { ...env, RATE, DAILY_PER_VISITOR: "2" };
const call = () => onRequestPost({ request: mk({ image: b64, mediaType: "image/jpeg" }, { "cf-connecting-ip": "1.2.3.4" }), env: lim });
assert.equal((await call()).status, 200);
assert.equal((await call()).status, 200);
assert.equal((await call()).status, 429);

// upstream failure
globalThis.fetch = async () => new Response("no", { status: 500 });
assert.equal((await onRequestPost({ request: mk({ image: b64, mediaType: "image/jpeg" }), env })).status, 502);

console.log("read.js: all tests passed");
