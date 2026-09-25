# 宣传片录制工具

逐帧离线渲染游戏画面（虚拟时钟，1080p30 满帧），再用同一份按键剧本实时跑一遍录下游戏自己合成的音效与配乐，最后用 ffmpeg 合成。

1. 本地起服务：`python3 -m http.server 18770 --bind 127.0.0.1`（在仓库根目录）
2. 录制：`node rec.mjs ./spec.mjs <段落名> video` 和 `... audio`（需要 `npm i playwright`，使用本机 Chrome）
3. 字幕：`node captions.mjs` → `/tmp/rec/cap/*.png`
4. 合成：`python3 assemble.py` → `/tmp/rec/voxel-three-kingdoms.mp4`

游戏侧的钩子只在 `?rec` 参数下生效：`window.__onStep(frame)` 按模拟帧触发按键，`window.__view` 覆盖镜头。
