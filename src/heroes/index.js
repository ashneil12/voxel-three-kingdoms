// Playable officers. Each definition carries the voxel model (build), spring chains (chains), HUD portrait and lines;
// the moveset, rig and Musou are shared. The active hero is picked by ?hero=<id> (the title menu reloads with it).
import zhaoyun from './zhaoyun.js';
import guanyu from './guanyu.js';
import zhangfei from './zhangfei.js';
import lubu from './lubu.js';
import zhugeliang from './zhugeliang.js';
import { EXOSUIT } from './exosuit.js';
import { VANGUARD } from './vanguard.js';
import { VANGUARD_AUTHORED } from './vanguard-authored.js';
import { VANGUARD_SHEET } from './vanguard-sheet.js';
import { DIM } from '../hero/rig.js';

const params = new URLSearchParams(location.search);
// ?vanguard=authored | sheet swap in the earlier Vanguard builds for comparison (default: the turnaround-reference build)
const VAR = params.get('vanguard');
const VANGUARD_PICK = VAR === 'sheet' ? VANGUARD_SHEET : VAR === 'authored' ? VANGUARD_AUTHORED : VANGUARD;
export const DEMO = !new URLSearchParams(location.search).has('classic');
export const HEROES = DEMO ? [VANGUARD_PICK, EXOSUIT] : [zhaoyun, guanyu, zhangfei, zhugeliang, lubu];
const pick = new URLSearchParams(location.search).get('hero');
export const HERO = HEROES.find((h) => h.id === pick) || HEROES[0];
if (HERO.rigDim) Object.assign(DIM, HERO.rigDim);       // per-hero body proportions, before any rig is created
