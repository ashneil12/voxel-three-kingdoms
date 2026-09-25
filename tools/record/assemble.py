import json, subprocess, os
R = '/tmp/rec'; OUT = f'{R}/parts'; os.makedirs(OUT, exist_ok=True)
def run(args): subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)
V = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30']
A = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2']

def audio_args(seg, dur, extra_off=0):
    m = json.load(open(f'{R}/{seg}/audio.json'))
    off = (m['tF0'] - m['recT0']) / 1000 + extra_off
    mp = m['map']; slope = (mp[-1][1] - mp[0][1]) / (mp[-1][0] - mp[0][0])
    return off, slope / (1000 / 60)                         # atempo factor (<1 slows the audio down)

def segment(seg, dur, caps, start=0.0):
    """caps: [(png, t0, t1)] overlays with 0.3 s alpha fades. start: skip into the capture (s)."""
    off, tempo = audio_args(seg, dur)
    ins = ['-framerate', '30', '-start_number', str(int(start * 30)), '-i', f'{R}/{seg}/f%05d.jpg', '-ss', f'{off + start * tempo:.3f}', '-i', f'{R}/{seg}/audio.webm']
    fc, last = [], '0:v'
    for k, (png, t0, t1) in enumerate(caps):
        ins += ['-loop', '1', '-t', f'{dur}', '-i', f'{R}/cap/{png}.png']
        i = k + 2
        fc.append(f'[{i}:v]format=rgba,fade=t=in:st={t0}:d=0.35:alpha=1,fade=t=out:st={t1}:d=0.35:alpha=1[c{k}]')
        fc.append(f'[{last}][c{k}]overlay=0:0:format=auto[v{k}]'); last = f'v{k}'
    fc.append(f'[{last}]trim=duration={dur},setpts=PTS-STARTPTS,format=yuv420p[vo]')
    fc.append(f'[1:a]atempo={tempo:.5f},atrim=duration={dur},asetpts=PTS-STARTPTS,afade=t=in:d=0.25[ao]')
    run([*ins, '-filter_complex', ';'.join(fc), '-map', '[vo]', '-map', '[ao]', '-t', f'{dur}', *V, *A, f'{OUT}/{seg}.mp4'])
    return f'{OUT}/{seg}.mp4', dur

def still(name, png, dur, audio_seg, audio_at, zoom=0.04, caps=()):
    off, tempo = audio_args(audio_seg, dur)
    ins = ['-loop', '1', '-framerate', '30', '-t', f'{dur}', '-i', png, '-ss', f'{off + audio_at:.3f}', '-i', f'{R}/{audio_seg}/audio.webm']
    n = int(dur * 30)
    fc = [f"[0:v]scale=3840:-1,zoompan=z='1+{zoom}*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30[z]"]
    last = 'z'
    for k, (p, t0, t1) in enumerate(caps):
        ins += ['-loop', '1', '-t', f'{dur}', '-i', f'{R}/cap/{p}.png']
        fc.append(f'[{k + 2}:v]format=rgba,fade=t=in:st={t0}:d=0.35:alpha=1,fade=t=out:st={t1}:d=0.35:alpha=1[c{k}]')
        fc.append(f'[{last}][c{k}]overlay=0:0[v{k}]'); last = f'v{k}'
    fc.append(f'[{last}]trim=duration={dur},format=yuv420p[vo]')
    fc.append(f'[1:a]atrim=duration={dur},asetpts=PTS-STARTPTS,volume=0.8[ao]')
    run([*ins, '-filter_complex', ';'.join(fc), '-map', '[vo]', '-map', '[ao]', '-t', f'{dur}', *V, *A, f'{OUT}/{name}.mp4'])
    return f'{OUT}/{name}.mp4', dur

def montage(name, pngs, each, audio_seg, audio_at, caps=()):
    parts = []
    for i, p in enumerate(pngs):
        o = f'{OUT}/_{name}{i}.mp4'
        run(['-loop', '1', '-framerate', '30', '-t', f'{each}', '-i', p, '-vf', f"scale=3840:-1,zoompan=z='1.03+0.03*on/{int(each*30)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,format=yuv420p", *V, '-an', o])
        parts.append(o)
    lst = f'{OUT}/_{name}.txt'; open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    run(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', f'{OUT}/_{name}_v.mp4'])
    return still_from_video(name, f'{OUT}/_{name}_v.mp4', each * len(pngs), audio_seg, audio_at, caps)

def still_from_video(name, vid, dur, audio_seg, audio_at, caps):
    off, _ = audio_args(audio_seg, dur)
    ins = ['-i', vid, '-ss', f'{off + audio_at:.3f}', '-i', f'{R}/{audio_seg}/audio.webm']
    fc, last = [], '0:v'
    for k, (p, t0, t1) in enumerate(caps):
        ins += ['-loop', '1', '-t', f'{dur}', '-i', f'{R}/cap/{p}.png']
        fc.append(f'[{k + 2}:v]format=rgba,fade=t=in:st={t0}:d=0.35:alpha=1,fade=t=out:st={t1}:d=0.35:alpha=1[c{k}]')
        fc.append(f'[{last}][c{k}]overlay=0:0[v{k}]'); last = f'v{k}'
    fc.append(f'[{last}]trim=duration={dur},format=yuv420p[vo]')
    fc.append(f'[1:a]atrim=duration={dur},asetpts=PTS-STARTPTS,volume=0.8[ao]')
    run([*ins, '-filter_complex', ';'.join(fc), '-map', '[vo]', '-map', '[ao]', '-t', f'{dur}', *V, *A, f'{OUT}/{name}.mp4'])
    return f'{OUT}/{name}.mp4', dur

# ---------------------------------------------------------------- timeline
H = ['zhaoyun', 'guanyu', 'zhangfei', 'zhugeliang', 'lubu']
T = []
T.append(still('title', f'{R}/cap/title.png', 3.6, 'fly_changban', 0.5, 0.05))
T.append(montage('select', [f'{R}/sel/{h}.png' for h in H], 1.0, 'fly_changban', 4.0, [('sec_heroes', 0.15, 4.3)]))
for h in H:
    T.append(segment(h, 13.2, [(f'name_{h}', 0.25, 3.3), (f'mu_{h}', 9.35, 11.9)]))
T.append(segment('boss', 13.8, []))
T.append(segment('fly_changban', 5.6, [('sec_stages', 0.1, 2.0), ('pl_changban', 2.2, 5.0)]))
T.append(segment('fly_hulao', 5.6, [('pl_hulao', 0.4, 5.0)]))
T.append(segment('fly_chibi', 5.6, [('pl_chibi', 0.4, 5.0)]))
T.append(still('end', f'{R}/cap/end.png', 5.5, 'lubu', 10.5, 0.04))

# chain with 0.35 s crossfades
X = 0.35
ins, fcv, fca = [], [], []
for p, _ in T: ins += ['-i', p]
acc = T[0][1]; lv, la = '0:v', '0:a'
for i in range(1, len(T)):
    off = acc - X
    fcv.append(f'[{lv}][{i}:v]xfade=transition=fade:duration={X}:offset={off:.3f}[xv{i}]'); lv = f'xv{i}'
    fca.append(f'[{la}][{i}:a]acrossfade=d={X}[xa{i}]'); la = f'xa{i}'
    acc += T[i][1] - X
fin = acc
fcv.append(f'[{lv}]fade=t=in:d=0.6,fade=t=out:st={fin - 1.2:.2f}:d=1.2[vf]')
fca.append(f'[{la}]afade=t=in:d=0.6,afade=t=out:st={fin - 1.5:.2f}:d=1.5,loudnorm=I=-15:TP=-1.5:LRA=11[af]')
FV = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-maxrate', '16M', '-bufsize', '32M', '-pix_fmt', 'yuv420p', '-r', '30', '-profile:v', 'high', '-level', '4.1']
run([*ins, '-filter_complex', ';'.join(fcv + fca), '-map', '[vf]', '-map', '[af]', *FV, *A, '-movflags', '+faststart', f'{R}/voxel-three-kingdoms.mp4'])
run(['-i', f'{R}/voxel-three-kingdoms.mp4', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '5.5M', '-maxrate', '7M', '-bufsize', '14M', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', f'{R}/voxel-three-kingdoms-small.mp4'])
print('total', round(fin, 2), 's')
