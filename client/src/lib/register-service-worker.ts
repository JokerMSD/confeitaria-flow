export async function registerServiceWorker() {
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    console.error("Failed to register service worker", error);
  }
}
