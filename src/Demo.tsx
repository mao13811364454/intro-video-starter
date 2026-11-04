import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Captions, Cue, Guide, Photo, WholeDetailComparison} from './components/IntroGraphics';
import {fontFamily} from './font';
import content from './demo-content.json';

const ease = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.16, 1, .3, 1)} as const;
const Title = ({ending = false}: {ending?: boolean}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{justifyContent: 'center', padding: 140, boxSizing: 'border-box', background: '#112832'}}>
    <div style={{position: 'absolute', right: 130, top: 160, width: 5, height: 540, background: '#b5e1e4', opacity: .4}}/>
    <div style={{fontSize: 25, letterSpacing: 8, color: '#b5e1e4', marginBottom: 28,
      opacity: interpolate(frame, [0, .4 * fps], [0, 1], ease)}}>OBSERVE / 01</div>
    <div style={{fontSize: ending ? 76 : 100, fontWeight: 600, color: '#f4f4ed', lineHeight: 1.4,
      opacity: interpolate(frame, [.08 * fps, .56 * fps], [0, 1], ease),
      translate: `0 ${interpolate(frame, [.08 * fps, .56 * fps], [16, 0], ease)}px`}}>
      {ending ? content.ending : content.title}
    </div>
    {!ending && <div style={{fontSize: 38, color: '#b5e1e4', marginTop: 34,
      opacity: interpolate(frame, [.16 * fps, .64 * fps], [0, 1], ease)}}>{content.subtitle}</div>}
  </AbsoluteFill>;
};

const Overall = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Finish a small camera move at 2 s, then keep 4 s completely still.
  const p = interpolate(frame, [0, 2 * fps], [0, 1], ease);
  return <AbsoluteFill style={{background: '#112832'}}>
    <Photo src={staticFile(content.overallImage)} sourceSize={[1920, 1080]}
      crop={[40 * p, 22.5 * p, 1920 - 80 * p, 1080 - 45 * p]}/>
    <Cue text={content.observation} start={.16} end={6} kind="T" hold/>
    <Guide start={1.2} end={6} rect={[1090, 440, 230, 160]} hold/>
  </AbsoluteFill>;
};

export const Demo = () => {
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#112832', fontFamily}}>
    <Sequence name="P01 · 开场" durationInFrames={3 * fps}><Title/></Sequence>
    <Sequence name="P02 · 整体观察" from={3 * fps} durationInFrames={6 * fps}><Overall/></Sequence>
    <Sequence name="P03 · 整体与细节" from={9 * fps} durationInFrames={6 * fps}>
      <WholeDetailComparison overallSrc={staticFile(content.overallImage)} detailSrc={staticFile(content.detailImage)}
        sourceSize={[1920, 1080]} overallCrop={[0, 0, 1920, 1080]} detailCrop={[840, 300, 960, 540]}
        labels={['整体', '细节']} durationSeconds={6}/>
      <Captions captions={[{text: content.comparisonCaption, startMs: 800, endMs: 5800, timestampMs: null, confidence: null}]}/>
    </Sequence>
    <Sequence name="P04 · 收束" from={15 * fps} durationInFrames={3 * fps}><Title ending/></Sequence>
    <Audio name="程序合成的演示配乐" src={staticFile('demo/ambience.wav')} volume={.55}/>
  </AbsoluteFill>;
};
