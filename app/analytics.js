// Umami Cloud (free) analytics. Paste the Website ID from your Umami dashboard below.
// While this is empty, no tracking script loads and nothing is recorded.
export const ANALYTICS_WEBSITE_ID = "";

// Records a custom event. Safe to call when analytics is not set up or is blocked.
export function track(name, data) {
  try {
    if (typeof window !== "undefined" && window.umami) window.umami.track(name, data);
  } catch {
    // Analytics must never break the form.
  }
}
