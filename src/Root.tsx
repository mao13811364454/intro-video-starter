import {Composition} from 'remotion';
import {Demo} from './Demo';
export const Root = () => <Composition
  id="IntroDemo" component={Demo}
  width={1920} height={1080} fps={30} durationInFrames={540}
/>;
