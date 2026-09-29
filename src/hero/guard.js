// Defensive hit rules, kept separate from animations and effects for deterministic checks.
export function guardHit(h, frame, dmg, fromX, fromZ) {
  if (h.state !== 'guard' || h.guard <= 0) return null;
  const toAttacker = Math.atan2(fromX - h.x, fromZ - h.z);
  const angle = Math.atan2(Math.sin(toAttacker - h.yaw), Math.cos(toAttacker - h.yaw));
  if (Math.abs(angle) > 1.25) return null;
  if (frame - h.guardStart <= 8 && h.parryCd === 0) {
    h.parryCd = 150; h.guard = Math.min(h.guardMax, h.guard + 8); h.guardWait = 45;
    return { type: 'parry', chip: 0, broken: false };
  }
  h.guard = Math.max(0, h.guard - Math.max(18, dmg * 0.8));
  h.guardWait = 85;
  const chip = Math.max(1, Math.ceil(dmg * 0.18));
  h.hp = Math.max(0, h.hp - chip);
  return { type: 'block', chip, broken: h.guard === 0 };
}
