export const COSMETIC_CATALOG = [
  { id: "gloves_classic", slot: "gloves", name: "Classic Gloves", cost: 0, icon: "🧤" },
  { id: "gloves_neon", slot: "gloves", name: "Neon Gloves", cost: 120, icon: "✨" },
  { id: "ball_classic", slot: "ball", name: "Classic Ball", cost: 0, icon: "⚽" },
  { id: "ball_comet", slot: "ball", name: "Comet Ball", cost: 180, icon: "☄️" },
  { id: "net_forest", slot: "net", name: "Forest Net", cost: 90, icon: "🌲" },
  { id: "background_night", slot: "background", name: "Night Stadium", cost: 220, icon: "🌙" },
  { id: "costume_captain", slot: "costume", name: "Fox Captain", cost: 260, icon: "🦊" },
  { id: "celebration_stars", slot: "celebration", name: "Star Burst", cost: 150, icon: "🌟" },
];

export function buyCosmetic(profile, cosmeticId) {
  const item = COSMETIC_CATALOG.find((candidate) => candidate.id === cosmeticId);
  if (!item) return { ok: false, reason: "unknown" };
  if (profile.inventory.includes(item.id)) return { ok: false, reason: "owned" };
  if (profile.coins < item.cost) return { ok: false, reason: "coins" };
  profile.coins -= item.cost;
  profile.inventory.push(item.id);
  return { ok: true, item };
}

export function equipCosmetic(profile, cosmeticId) {
  const item = COSMETIC_CATALOG.find((candidate) => candidate.id === cosmeticId);
  if (!item || !profile.inventory.includes(item.id)) return false;
  profile.equipped[item.slot] = item.id;
  return true;
}
