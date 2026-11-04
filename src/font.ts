import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
// Bundled, unmodified OFL font. No render-time request to a font CDN.
await loadFont({family: 'Noto Starter', url: staticFile('fonts/NotoSansSC.ttf'), weight: '100 900'});
export const fontFamily = 'Noto Starter, sans-serif';
