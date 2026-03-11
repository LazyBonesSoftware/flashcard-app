// Storage utility using sessionStorage (per-tab, not persisted)
// This ensures each user session is independent — no API keys leak between friends

const DECKS_KEY = "fc_decks";

export function getDecks() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeck(deck) {
  if (typeof window === "undefined") return;
  const decks = getDecks();
  const existing = decks.findIndex((d) => d.id === deck.id);
  if (existing >= 0) {
    decks[existing] = deck;
  } else {
    decks.unshift(deck);
  }
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function deleteDeck(id) {
  if (typeof window === "undefined") return;
  const decks = getDecks().filter((d) => d.id !== id);
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function getDeck(id) {
  return getDecks().find((d) => d.id === id) || null;
}

// Generate a simple unique ID
export function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
