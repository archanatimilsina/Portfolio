/**
 * Single source of truth for whether Gesture Navigation is enabled.
 *
 * The landing page's "Gesture Nav" button writes this flag; the global
 * <GestureNavigator /> reads it. A custom window event keeps both React
 * trees in sync within the same tab (the native `storage` event only fires
 * in other tabs).
 */

const STORAGE_KEY = "gestureNav"; // "active" | "inactive"
const CHANGE_EVENT = "gesturenavchange";

export function getGestureNavStatus() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "active" ? "active" : "inactive";
  } catch {
    return "inactive";
  }
}

export function isGestureNavEnabled() {
  return getGestureNavStatus() === "active";
}

export function setGestureNavStatus(status) {
  const next = status === "active" ? "active" : "inactive";
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable — still notify listeners below */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function subscribeGestureNav(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
