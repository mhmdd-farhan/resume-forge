export function trackPageView(path: string) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "pageview", name: path }),
    keepalive: true,
  }).catch(() => {});
}

export function trackClick(event: string) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "click", name: event }),
    keepalive: true,
  }).catch(() => {});
}
