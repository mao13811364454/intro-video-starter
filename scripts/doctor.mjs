import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {root} from './prepare-assets.mjs';
const major = Number(process.versions.node.split('.')[0]);
const results = [{name: 'Node', ok: [24, 26].includes(major), detail: process.version}];
for (const binary of ['ffmpeg', 'ffprobe']) {
  try {results.push({name: binary, ok: true, detail: execFileSync(binary, ['-version'], {encoding: 'utf8', timeout: 10000}).split('\n')[0]});}
  catch {results.push({name: binary, ok: false, detail: 'Install it and make it available in PATH. No installation was attempted.'});}
}
for (const file of ['node_modules/remotion/package.json', 'public/fonts/NotoSansSC.ttf']) {
  results.push({name: file, ok: fs.existsSync(path.join(root, file))});
}
console.log(JSON.stringify({platform: `${process.platform}/${process.arch}`, results, browser: 'Chrome Headless Shell is downloaded by Remotion on first use if absent.'}, null, 2));
if (results.some(result => !result.ok)) process.exitCode = 1;
