// Playable officers. Each definition carries the voxel model (build), spring chains (chains), HUD portrait and lines;
// the moveset, rig and Musou are shared. The active hero is picked by ?hero=<id> (the title menu reloads with it).
import zhaoyun from './zhaoyun.js';
import guanyu from './guanyu.js';
import zhangfei from './zhangfei.js';
import lubu from './lubu.js';
import zhugeliang from './zhugeliang.js';
import { EXOSUIT } from './exosuit.js';
import { VANGUARD_SHEET } from './vanguard-sheet.js';
import { VANGUARD_RESKIN } from './vanguard-reskin.js';
import { VANGUARD_BLOCK } from './vanguard-block.js';
import { BASTION } from './bastion.js';
import { BREAKER } from './breaker.js';
import { APEX } from './apex.js';
import { ORACLE } from './oracle.js';   // EXO reskins of the other four officers   // default: the block concept   // default: Zhao Yun's suit reskinned as the EXO suit
import { VANGUARD_AUTHORED } from './vanguard-authored.js';
import { VANGUARD as VANGUARD_REF } from './vanguard.js';
import { DIM } from '../hero/rig.js';

const params = new URLSearchParams(location.search);
// Default Vanguard = the character-sheet reconstruction (tools/vanguard: sheet views -> silhouette carve -> RLE voxels per rig joint).
// ?vanguard=ref (turnaround-reference boxes, tools/vanguard-ref) and ?vanguard=authored (hand-authored fine voxels) stay available.
const VAR = params.get('vanguard');
const VANGUARD_PICK = VAR === 'sheet' ? VANGUARD_SHEET : VAR === 'block' ? VANGUARD_BLOCK : VAR === 'reskin' ? VANGUARD_RESKIN : VAR === 'sheet' ? VANGUARD_SHEET : VAR === 'ref' ? VANGUARD_REF : VAR === 'authored' ? VANGUARD_AUTHORED : VANGUARD_AUTHORED;
export const DEMO = !new URLSearchParams(location.search).has('classic');
export const HEROES = DEMO ? [VANGUARD_PICK, BASTION, BREAKER, APEX, ORACLE, EXOSUIT] : [zhaoyun, guanyu, zhangfei, zhugeliang, lubu];
const pick = new URLSearchParams(location.search).get('hero');
export const HERO = HEROES.find((h) => h.id === pick) || HEROES[0];
if (HERO.rigDim) Object.assign(DIM, HERO.rigDim);       // per-hero body proportions, before any rig is created
