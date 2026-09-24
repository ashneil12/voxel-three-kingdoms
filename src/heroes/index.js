// Playable officers. Each definition carries the voxel model (build), spring chains (chains), HUD portrait and lines;
// the moveset, rig and Musou are shared. The active hero is picked by ?hero=<id> (the title menu reloads with it).
import zhaoyun from './zhaoyun.js';
import guanyu from './guanyu.js';

export const HEROES = [zhaoyun, guanyu];
const pick = new URLSearchParams(location.search).get('hero');
export const HERO = HEROES.find((h) => h.id === pick) || HEROES[0];
