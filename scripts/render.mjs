import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {parseArgs} from 'node:util';
import {prepareAssets, root} from './prepare-assets.mjs';

const {values} = parseArgs({options: {
  out: {type: 'string', default: 'out/demo.mp4'},
  project: {type: 'string'},
}});
if (values.project && !/^[a-z][a-z0-9-]{1,46}[a-z0-9]$/.test(values.project)) throw new Error('Invalid project ID');
const output = path.resolve(root, values.out);
if (path.extname(output).toLowerCase() !== '.mp4') throw new Error('Output must end in .mp4');
try {await fs.lstat(output); throw new Error('Output already exists. Choose a new --out filename.');}
catch (error) {if (error.code !== 'ENOENT') throw error;}
if (!values.project) await prepareAssets();
const project = values.project ? path.join(root, 'projects', values.project) : null;
const entryPoint = project ? path.join(project, 'index.tsx') : path.join(root, 'src/index.tsx');
const publicDir = project ? path.join(project, 'assets') : path.join(root, 'public');
if (project) {
  try {
    if (!(await fs.stat(project)).isDirectory() || !(await fs.stat(entryPoint)).isFile() || !(await fs.stat(publicDir)).isDirectory()) throw new Error('Invalid project structure');
  } catch (error) {
    throw new Error(`Project ${values.project} is missing or incomplete. First run npm run new -- ${values.project} --title '项目名称', or inspect its index.tsx and assets/.`, {cause: error});
  }
}
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'intro-video-render-'));
await fs.mkdir(path.dirname(output), {recursive: true});
let browser;
try {
  const serveUrl = await bundle({entryPoint, rootDir: root, outDir: temporary, publicDir, rspack: true});
  browser = await openBrowser('chrome');
  const composition = await selectComposition({serveUrl, id: project ? 'IntroFilm' : 'IntroDemo', puppeteerInstance: browser});
  let last = -1;
  await renderMedia({serveUrl, composition, outputLocation: output,
    codec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p', crf: 18, concurrency: 2,
    puppeteerInstance: browser, overwrite: false,
    onProgress: ({progress}) => {const p = Math.floor(progress * 10) * 10; if (p > last) {last = p; console.log(`${p}%`);}},
  });
  console.log(`Saved ${output}`);
} finally {
  if (browser) await browser.close({silent: true});
  await fs.rm(temporary, {recursive: true, force: true});
}
