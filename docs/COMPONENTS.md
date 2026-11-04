# 组件与时钟

源码：[IntroGraphics.tsx](../src/components/IntroGraphics.tsx)。v1 的固定坐标组件仅接受 1920×1080 画布。改变画幅需重新适配和验证；不是修改宽高两个数字即可。

| 组件 | 用途与主要参数 |
|---|---|
| `Cue` | 文字小幅上移与淡入；`start/end` 为当前场景秒数，辅助层 `kind="A"` 仅淡入；层级可错峰 0.08 秒 |
| `Captions` | 居中的底部字幕；`startMs/endMs` 是其所在源时钟的毫秒数；文字长度和行数由作者检查 |
| `Guide` | 观察框或路径；`rect=[x,y,w,h]`，时间为场景秒数 |
| `Photo` | 静图与裁切；`sourceSize` 申报实际源尺寸，`crop` 使用源像素坐标 |
| `Presenter` | 视频全屏与圆形画中画；视频自身静音，另安排人声音轨；需核对人物中心、裁切和时钟 |
| `WholeDetailComparison` | 整体与细节双栏；两张源图必须都是 1920×1080，裁切矩形必须为正数、16:9 |
| `ImageCard` | 封面／片尾整图，`fit` 可为 `contain` 或 `cover` |
| `Dissolve` | 所含画面淡入 |

`Photo` 与 `Presenter` 的 `sourceSize` 默认 1920×1080；只有已探测确认源尺寸相同时才能省略。组件不探测文件，也不保证观察框一定落在你要介绍的部位。

## 主持人裁切示例

```tsx
import {Audio} from '@remotion/media';
import {Sequence, staticFile} from 'remotion';
import {Presenter, Captions} from './components/IntroGraphics';

const sourceStart = 81; // 源入点，单位帧；示例按 30 fps
<Sequence trimBefore={sourceStart} durationInFrames={150}>
  <Presenter src={staticFile('source/host.mp4')}
    sourceSize={[1920, 1080]}
    geometryOffsetFrames={sourceStart}
    changes={[[0, 0], [30, 0], [60, 1]]}/>
  <Audio src={staticFile('source/host.mp4')}/>
  <Captions captions={[{
    text: '按实际口语校对的字幕', startMs: 3000, endMs: 5000,
    timestampMs: null, confidence: null,
  }]}/>
</Sequence>
```

`changes` 使用裁切后镜头内部的帧数；值 0 是全屏，1 是圆框。`geometryOffsetFrames` 必须与共同父级的正值 `trimBefore` 使用同一变量。字幕保持原始录音时码；不要再次减去入点。音频和画面也不要再次独立裁切。示例中的导入路径适用于 `src/` 下文件；独立项目使用 `../../src/components/IntroGraphics`。

这里使用 Remotion 4.0.539 的 `Sequence trimBefore`：子级 `useCurrentFrame()` 在镜头开始时已是 81，而非 0。`Captions` 直接使用这个帧数；`Presenter` 只为几何动画减去 `geometryOffsetFrames`，视频和独立音频继续使用共同父级时钟。不要把父级换成未裁切的 Sequence 后继续套用这个例子。

本包没有真人演示素材。历史工程曾验证这一时钟关系，但更换人物、声轨或编码格式后仍需用实际录制样片检查口型、裁切和同步。
