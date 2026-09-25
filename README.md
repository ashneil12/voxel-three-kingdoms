# 體素三國 · Voxel Three Kingdoms

<p align="center"><img src="media/title.jpg" alt="體素三國 标题页：选将、选战场" width="100%"></p>

一款浏览器里就能玩的体素风三国割草动作游戏，基于 Three.js。五名武将、三处战场，一人独闯数百敌军。

无需构建：纯 ES 模块，Three.js r186 已内置于 `vendor/three/`，逻辑以固定 60 Hz 确定性步进运行。

*A browser-playable voxel hack-and-slash set in the Three Kingdoms. Five officers, three battles, hundreds of soldiers. Plain ES modules, no build step.*

## 武将

![五名武将：赵云、关羽、张飞、诸葛亮、吕布](media/heroes.jpg)

| 武将 | 兵器 | 特点 |
| --- | --- | --- |
| **趙雲** 常山 | 龍膽亮銀槍 | 白银鳞甲、马尾与飘带、蓝色枪缨 |
| **關羽** 武聖 | 青龍偃月刀 | 绿袍金甲、吞肩兽、垂到腹部的美髯 |
| **張飛** 燕人 | 丈八蛇矛 | 豹头环眼、虎须、红缨铁盔、虎皮战裙 |
| **諸葛亮** 臥龍 | 白羽扇 | 纶巾鹤氅、八卦披风，出招时羽扇化出风刃 |
| **呂布** 飛將 | 方天畫戟 | 紫金冠、双雉鸡翎、黑金兽面甲、红锦袍 |

每名武将有自己的模型、兵器、飘动部件（披风、胡须、翎羽、缨穗都是弹簧链）、像素头像、台词和无双特写。

### 招式与无双

每名武将都有**自己的一套招式**：自己的连段长度、蓄力分支、判定和逐帧关键帧动作，以及**自己的无双**。赵云保留原作的枪法与青龙无双。其余四人的招式在 `src/heroes/*.moves.js`。

| 武将 | 普攻连段 | 蓄力 | 无双 |
| --- | --- | --- | --- |
| 趙雲 | 6 段枪法 | C1–C6 | 青龙冲阵 |
| 關羽 | 5 段重刀：斜撩、劈砍、横斩、回旋、跃斩（带青龙月牙） | 青龍斬 / 挑斩 / 旋风 / 三连月牙 / 跃劈破地 | 青龍偃月・天斬：拖刀冲锋、巨斩、回旋，落地一圈月牙 |
| 張飛 | 6 段蛮力：刺、进步刺、抡扫、肩撞、下砸、头顶舞矛接跺地 | 當陽一喝接挑刺 / 冲刺挑 / 连刺 / 双旋 / 跃起跺地 | 燕人咆哮：一喝震退、冲锋、乱刺、跺地裂地 |
| 諸葛亮 | 6 段羽扇：每下都甩出风刃，第 5 段是光束，第 6 段是八刃环 | 光束 / 旋风挑空 / 边退边连射 / 旋转刃环 / 天降光柱 | 東風・八陣：东风起、八向光束、光柱行进、刃雨、光环 |
| 呂布 | 6 段快攻：快斩、反斩、上撩、跳旋、双旋、跃砸（带赤月牙） | 天下無雙 540° 扫 / 挑空 / 突刺穿阵 / 龙卷 / 跃刺 | 天下無雙・神鬼亂舞：之字形连续突进，最后十二道赤月牙 |

四人的蓄力起手时，兵器上会聚起本人颜色的光；无双龙也各有颜色。
## 战场

| | | |
| --- | --- | --- |
| ![长坂坡](media/changban.jpg) | ![虎牢关](media/hulao.jpg) | ![赤壁](media/chibi.jpg) |
| **長坂坡** · 黄昏 · 魏军 | **虎牢關** · 白昼 · 董卓军 | **赤壁** · 夜战火攻 · 曹军 |

每处战场有自己的天空、光照、画面风格、敌军旗号与军服颜色、敌将阵容，部分武将还有专属开场台词（比如虎牢关的关羽：「溫酒之間，斬汝華雄！」）。

- **虎牢關**：两侧岩壁夹道，一路收窄到关门。开战约 20 秒或击破 45 人后，**吕布**从关前杀出，这就是「三英戰呂布」。他有独立血条和霸体，会用三种有预警的招式：地面先亮起红色警示圈或突刺线路，然后打出旋扫、突刺或跃击；打掉他的架势条可以让他硬直。如果玩家选的是吕布，杀出来的就换成**关羽**。
- **赤壁**：战场后方是一条大江，江面上泊着用铁链相连的曹军战船（連環船），多艘正在燃烧，火光映在水面上。

![无双特写](media/musou.jpg)

## 运行

ES 模块无法通过 `file://` 加载，请用任意静态服务器托管此目录：

```sh
python3 -m http.server 8000
```

然后打开 http://localhost:8000 。需要支持 WebGL2 的浏览器，推荐使用独立显卡的桌面电脑。

## 操作

| 动作 | 按键 |
| --- | --- |
| 移动 | WASD / 方向键 |
| 普通攻击（6 段连击） | J / 鼠标左键 |
| 蓄力攻击 | K / 鼠标右键 |
| 跳跃 | 空格 |
| 闪避 | L / Shift |
| 无双（金色槽满时） | I |
| 旋转镜头 | Q E / 鼠标拖动 |
| 暂停 | Esc |
| 标题页选将 / 选战场 | ← → / ↑ ↓ |

也支持手柄。

## URL 参数

| 参数 | 说明 |
| --- | --- |
| `?hero=` | `zhaoyun` `guanyu` `zhangfei` `zhugeliang` `lubu` |
| `?stage=` | `changban` `hulao` `chibi` |
| `?look=` | 画面风格：`dusk` 黄昏电影 · `ink` 水墨 · `night` 夜战 · `bright` 明快 · `retro` 像素 |
| `?enemies=N` | 敌兵数量，0–2000（默认 300） |
| `?zoom=0.5` | 调试：拉近镜头 |
| `?musou` | 调试：开局无双槽满 |
| `?debug` | 调试：在控制台暴露 `game` / `scene` |
| `?boss` | 调试：Boss 开场 1 秒即登场（虎牢关） |
| `?view=x,y,z,tx,ty,tz` | 调试：固定机位 |
| `?preview=n3` | 调试：定格某一招（配合 `window.previewT = 0..1` 逐帧看姿势） |

## 目录结构

```
index.html      入口、importmap、HUD 与标题页样式
src/heroes/     每名武将一个文件：模型、兵器、弹簧链、头像、台词、战斗风格
src/stages/     战场配置：天空、光照、敌军、台词、布景、Boss
src/boss/       Boss 模拟与表现（虎牢关 三英戰呂布）
src/            core、hero、combat、crowd、musou、camera、vfx、post、world、audio、ui
vendor/three/   Three.js r186
```

新增武将：在 `src/heroes/` 仿照现有文件写一个定义（`build()` 返回各关节的体素块，`chains()` 返回飘动部件），再加进 `src/heroes/index.js`。自己的招式写在 `*.moves.js`：`moves()` 招式表、`clips(A, M)` 用 `src/hero/anims/author.js` 逐帧写动作、`musou` 无双脚本。

## 致谢与许可

- 基于 BubuAi 的 [Voxel Musou](https://github.com/mike007jd/voxel-musou)（MIT）。战斗、人群 AI、镜头、特效、后处理和音频系统都来自原作。
- 代码：MIT 许可，见 [LICENSE](LICENSE)。
- [three.js](https://threejs.org/)：MIT 许可。
- HUD 备用字体 `src/ui/brush.woff2` 是 Yuji Boku（Kinuta Font Factory）的子集，采用 SIL Open Font License 1.1 授权。

本项目为同人作品，与 KOEI TECMO 无关，也未获其认可。“真·三国无双 / Dynasty Warriors” 是 KOEI TECMO 的商标。本项目不包含任何原作游戏素材。
