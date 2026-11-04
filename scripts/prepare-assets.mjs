import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function writeNewOrIdentical(file, data) {
  const bytes = Buffer.from(data);
  await fs.mkdir(path.dirname(file), {recursive: true});
  try {await fs.writeFile(file, bytes, {flag: 'wx'});}
  catch (error) {
    if (error.code !== 'EEXIST' || !(await fs.readFile(file)).equals(bytes)) {
      throw new Error(`Refusing to replace changed asset: ${file}`, {cause: error});
    }
  }
}

export async function prepareAssets() {
  // Original stylized illustration, not a photograph or a botanical specimen.
  const veins = Array.from({length: 9}, (_, i) => {
    const x = 690 + i * 67, y = 820 - i * 58;
    return `<path d="M${x} ${y} Q${x - 110} ${y - 20} ${x - 160 + i * 8} ${y - 160} M${x} ${y} Q${x + 120} ${y + 15} ${x + 210 - i * 8} ${y - 30}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
<defs><radialGradient id="bg"><stop stop-color="#2d5355"/><stop offset="1" stop-color="#112832"/></radialGradient><linearGradient id="leaf" x2=".9" y2="1"><stop stop-color="#d4dfaa"/><stop offset=".55" stop-color="#72a68e"/><stop offset="1" stop-color="#306c61"/></linearGradient><clipPath id="mask"><path d="M620 875 C430 640 530 300 1410 140 C1490 650 1170 1000 620 875Z"/></clipPath></defs>
<rect width="1920" height="1080" fill="url(#bg)"/><circle cx="1520" cy="350" r="330" fill="#b5e1e4" opacity=".025"/>
<path d="M620 875 C430 640 530 300 1410 140 C1490 650 1170 1000 620 875Z" fill="url(#leaf)"/>
<g clip-path="url(#mask)" fill="none" stroke="#e1e7b5" stroke-width="4" opacity=".48">${veins}</g>
<path d="M530 970 Q890 650 1410 140" fill="none" stroke="#dbe6bb" stroke-width="9" stroke-linecap="round"/>
</svg>`;
  await writeNewOrIdentical(path.join(root, 'public/demo/leaf.svg'), svg);
  const rate = 48000, frames = rate * 18, channels = 2;
  const wav = Buffer.alloc(44 + frames * channels * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * channels * 2, 28);
  wav.writeUInt16LE(channels * 2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  for (let i = 0; i < frames; i++) {
    const t = i / rate, envelope = Math.min(1, t / 1.5, (18 - t) / 1.5);
    const value = Math.round(32767 * .055 * envelope * (Math.sin(t * 2 * Math.PI * 130.8128) + .45 * Math.sin(t * 2 * Math.PI * 196) + .3 * Math.sin(t * 2 * Math.PI * 261.6256)));
    wav.writeInt16LE(value, 44 + i * 4); wav.writeInt16LE(value, 46 + i * 4);
  }
  await writeNewOrIdentical(path.join(root, 'public/demo/ambience.wav'), wav);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareAssets(); console.log('Demo SVG and stereo audio ready. Existing changes are preserved.');
}
