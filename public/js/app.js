// tarotgoth front end. No dependencies, no storage.
// Photos are resized in the browser, sent to /api/read, and never saved.
// Analytics (GA4) only records event names and coarse metadata, never photo, question or reading text.

import { track } from "/js/analytics.js";

const $ = (id) => document.getElementById(id);

const screens = ["home", "preview", "loading", "result", "error"];
const MAX_EDGE = 1568;

const LOADING_LINES = [
  "Omen is judging your layout.",
  "Counting cups. Most of them are empty.",
  "Pretending to be surprised.",
  "Sighing, but professionally."
];

const ERRORS = {
  bad_photo: ["Can't open that photo", "Try a different image, or take a new one."],
  no_cards: ["No cards in that photo", "Lay the cards flat, get the whole spread in frame, and retake it."],
  unreadable: ["Can't read that photo", "Too dark, too blurry, or the cards are cut off. Retake it in better light with the whole spread visible."],
  rate_limited: ["That's enough readings for today", "Come back tomorrow."],
  busy: ["Vesper is busy", "Try again in a minute."],
  offline: ["No connection", "Check your signal and try again."],
  server: ["Something broke on our end", "Try again in a minute."]
};

let photo = null; // { dataUrl, base64, mediaType, objectUrl }
let loadingTimer = null;
let controller = null;

function show(name, moveFocus = true) {
  for (const s of screens) $("screen-" + s).hidden = s !== name;
  const heading = $("screen-" + name).querySelector("h2");
  if (heading && moveFocus) heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showError(kind) {
  const [title, body] = ERRORS[kind] || ERRORS.server;
  $("error-title").textContent = title;
  $("error-body").textContent = body;
  track("read_error", { error_type: kind });
  show("error");
}

// ---------- Photo handling ----------

async function decode(file) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch { /* fall through to <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepare(file) {
  const bitmap = await decode(file);
  const w = bitmap.width || bitmap.naturalWidth;
  const h = bitmap.height || bitmap.naturalHeight;
  if (!w || !h) throw new Error("empty image");
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (bitmap.close) bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("encode failed");
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  return { dataUrl, base64: dataUrl.split(",")[1], mediaType: "image/jpeg", objectUrl: URL.createObjectURL(blob) };
}

async function onPicked(input, method) {
  const file = input.files && input.files[0];
  input.value = "";
  if (!file) return;
  try {
    if (photo) URL.revokeObjectURL(photo.objectUrl);
    photo = await prepare(file);
  } catch {
    photo = null;
    showError("bad_photo");
    return;
  }
  track("photo_selected", { method });
  $("preview-img").src = photo.objectUrl;
  show("preview");
}

// ---------- Reading ----------

function startLoading() {
  show("loading");
  let i = 0;
  $("loading-line").textContent = LOADING_LINES[0];
  loadingTimer = setInterval(() => {
    i = (i + 1) % LOADING_LINES.length;
    $("loading-line").textContent = LOADING_LINES[i];
  }, 3200);
}

function stopLoading() {
  clearInterval(loadingTimer);
  loadingTimer = null;
}

async function read() {
  if (!photo) return;
  track("read_submitted", { has_question: $("question").value.trim().length > 0 });
  startLoading();
  controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 70000);
  try {
    const res = await fetch("/api/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: photo.base64, mediaType: photo.mediaType, question: $("question").value.trim() }),
      signal: controller.signal
    });
    stopLoading();
    if (res.status === 429) return showError("rate_limited");
    if (res.status === 503) return showError("busy");
    if (!res.ok) return showError("server");
    const data = await res.json();
    render(data);
  } catch (err) {
    stopLoading();
    showError(err && err.name === "AbortError" ? "server" : "offline");
  } finally {
    clearTimeout(timeout);
  }
}

function render(data) {
  if (data.status === "no_cards" || data.status === "unreadable") return showError(data.status);

  const care = $("res-care");
  const body = $("res-body");
  const coffee = $("res-coffee");

  if (data.needs_care) {
    care.hidden = false;
    $("res-care-msg").textContent = data.verdict || "I'm putting the cards down. You matter more than the reading.";
    body.hidden = true;
    coffee.hidden = true;
    $("result-title").textContent = "Before anything else";
    track("care_shown");
    return show("result");
  }

  care.hidden = true;
  body.hidden = false;
  coffee.hidden = false;
  $("result-title").textContent = "What we found";

  $("res-spread").textContent = data.spread.name;
  const n = data.cards.length;
  $("res-count").textContent = `${n} ${n === 1 ? "card" : "cards"} found`;

  const list = $("res-cards");
  list.replaceChildren();
  for (const c of data.cards) {
    const li = el("li", "tcard" + (c.orientation === "reversed" ? " tcard--reversed" : ""));
    const face = el("div", "tcard__face" + (c.short.length > 2 ? "" : " tcard__face--short"), c.short || "");
    face.setAttribute("aria-hidden", "true");
    const name = el("span", "tcard__name", c.name);
    const meta = el("span", "tcard__meta");
    meta.append(`${c.position || "Card"}, ${c.orientation}`);
    if (c.uncertain) meta.append(" ", el("span", "tag-unsure", "(not sure)"));
    li.append(face, name, meta);
    list.append(li);
  }

  const reading = $("res-reading");
  reading.replaceChildren();
  reading.classList.remove("reading-reveal");
  if (data.verdict) reading.append(el("p", "reading__verdict", data.verdict));
  for (const s of data.sections || []) {
    const sec = el("section", "stack");
    const head = el("header", "reading__position");
    head.append(el("h3", "", s.card), el("span", "where", s.position));
    sec.append(head, el("p", "", s.text));
    reading.append(sec);
  }
  if (data.close) reading.append(el("p", "reading__verdict reading__close", data.close));
  void reading.offsetWidth; // restart the reveal
  reading.classList.add("reading-reveal");

  track("read_completed", { spread: data.spread.name, card_count: n });

  show("result");
}

// ---------- Question pills ----------

function setQuestion(text) {
  $("question").value = text;
  for (const p of document.querySelectorAll("#question-pills .pill")) {
    p.setAttribute("aria-pressed", String(text !== "" && p.textContent === text));
  }
}

function reset() {
  if (controller) controller.abort();
  stopLoading();
  if (photo) URL.revokeObjectURL(photo.objectUrl);
  photo = null;
  setQuestion("");
  show("home");
}

// ---------- Wiring ----------

$("btn-camera").addEventListener("click", () => $("in-camera").click());
$("btn-roll").addEventListener("click", () => $("in-roll").click());
$("in-camera").addEventListener("change", (e) => onPicked(e.target, "camera"));
$("in-roll").addEventListener("change", (e) => onPicked(e.target, "roll"));
$("btn-read").addEventListener("click", read);
$("question-pills").addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return;
  setQuestion(pill.getAttribute("aria-pressed") === "true" ? "" : pill.textContent);
});

const tracked = (name, handler) => () => { track(name); handler(); };
$("btn-retake").addEventListener("click", tracked("photo_changed", reset));
$("btn-wrong").addEventListener("click", tracked("card_wrong_retake", reset));
$("btn-again").addEventListener("click", tracked("read_another", reset));
$("btn-error-retry").addEventListener("click", tracked("error_retry", reset));
$("btn-care-again").addEventListener("click", tracked("care_restart", reset));
document.querySelector(".btn--coffee").addEventListener("click", () => track("coffee_click", { value: 5, currency: "AUD" }));

show("home", false);
