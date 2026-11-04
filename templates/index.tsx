import {Composition, registerRoot} from 'remotion';
import {Video} from './Video';
import config from './project.json';
const positive = (value: unknown, field: string) => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw new Error(`请先填写 project.json 的 ${field}（正整数）`);
  return value;
};
const width = positive(config.width, 'width');
const height = positive(config.height, 'height');
if (width !== 1920 || height !== 1080) {
  throw new Error('本版布局只支持 1920×1080；其他画幅须先适配组件和检查脚本，再修改此校验。');
}
const fps = positive(config.fps, 'fps');
const durationInFrames = positive(config.durationInFrames, 'durationInFrames');
const Root = () => <Composition id="IntroFilm" component={Video} width={width} height={height} fps={fps} durationInFrames={durationInFrames}/>;
registerRoot(Root);
