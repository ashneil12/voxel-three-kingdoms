// Vanguard's editable art parameters. Both the game and the browser studio use this definition.
export const SUIT_DEFAULT = Object.freeze({
  shell: '#d9d3c4',
  accent: '#42647c',
  dark: '#202d37',
  steel: '#788b94',
  signal: '#ffab55',
  shoulder: 1,
  chest: 1,
  armour: 1,
});

export const SUIT_LIMITS = Object.freeze({
  shoulder: [0.78, 1.22],
  chest: [0.84, 1.16],
  armour: [0.8, 1.2],
});

export const SUIT_STORAGE_KEY = 'exo-vanguard-design-v1';

export function suitDesign(input = {}) {
  const out = { ...SUIT_DEFAULT };
  for (const key of ['shell', 'accent', 'dark', 'steel', 'signal']) {
    if (typeof input[key] === 'string' && /^#[0-9a-f]{6}$/i.test(input[key])) out[key] = input[key];
  }
  for (const [key, [low, high]] of Object.entries(SUIT_LIMITS)) {
    const n = Number(input[key]);
    if (Number.isFinite(n) && input[key] !== undefined) out[key] = Math.max(low, Math.min(high, n));
  }
  return out;
}

export function loadSuitDesign() {
  try { return suitDesign(JSON.parse(localStorage.getItem(SUIT_STORAGE_KEY) || '{}')); }
  catch { return suitDesign(); }
}

export function saveSuitDesign(input) {
  const design = suitDesign(input);
  localStorage.setItem(SUIT_STORAGE_KEY, JSON.stringify(design));
  return design;
}
