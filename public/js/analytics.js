// Google Analytics 4 (G-ZF4418N9Q5). Loaded as an external module so the CSP can stay free of inline scripts.
// Only event names and coarse metadata are sent. Never photos, questions or reading text.

const GA_ID = "G-ZF4418N9Q5";

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;

gtag("js", new Date());
gtag("config", GA_ID, { anonymize_ip: true, allow_google_signals: false });

const s = document.createElement("script");
s.async = true;
s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
document.head.appendChild(s);

// Safe wrapper: never lets an ad blocker or analytics error break the app.
export function track(name, params) {
  try { gtag("event", name, params || {}); } catch { /* ignore */ }
}
