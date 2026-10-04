/** Tells the preference toast that the user just changed the theme or the language. */
export type PreferenceChange = { kind: "theme"; value: "light" | "dark" } | { kind: "lang"; value: "ar" | "en" };

export const PREFERENCE_EVENT = "manara:preference";

export function announcePreference(change: PreferenceChange) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PreferenceChange>(PREFERENCE_EVENT, { detail: change }));
}
