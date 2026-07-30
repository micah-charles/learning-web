import { COSMETIC_CATALOG, buyCosmetic, equipCosmetic } from "./rewardEngine.js";

export default function RewardShop({ profile, onChange }) {
  if (!profile) return null;
  function act(item) {
    const next = structuredClone(profile);
    if (next.inventory.includes(item.id)) {
      equipCosmetic(next, item.id);
    } else {
      const result = buyCosmetic(next, item.id);
      if (!result.ok) return;
      equipCosmetic(next, item.id);
    }
    onChange(next);
  }
  return (
    <details className="mini-shop">
      <summary>Cosmetic rewards <span>{profile.coins} coins</span></summary>
      <p>Rewards are visual only; learning difficulty and scores are never for sale.</p>
      <div className="mini-shop-grid">
        {COSMETIC_CATALOG.map((item) => {
          const owned = profile.inventory.includes(item.id);
          const equipped = profile.equipped[item.slot] === item.id;
          return (
            <button key={item.id} type="button" onClick={() => act(item)} disabled={!owned && profile.coins < item.cost}>
              <span>{item.icon}</span>
              <strong>{item.name}</strong>
              <small>{equipped ? "Equipped" : owned ? "Equip" : `${item.cost} coins`}</small>
            </button>
          );
        })}
      </div>
    </details>
  );
}
