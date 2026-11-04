import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {root} from './prepare-assets.mjs';

export async function createProject(base, id, title, dryRun = false) {
  if (!/^[a-z][a-z0-9-]{1,46}[a-z0-9]$/.test(id)) throw new Error('ID: 3–48 lowercase letters, digits or hyphens; start with a letter and end with a letter/digit');
  if (!title.trim() || /[\x00-\x1f\x7f]/.test(title)) throw new Error('Title must be nonempty and single-line');
  base = await fs.realpath(base);
  const parent = path.join(base, 'projects'), target = path.join(parent, id);
  for (const dir of [parent, target]) {
    try {
      const stat = await fs.lstat(dir);
      if (dir === target) throw new Error('Project already exists; refusing to replace it');
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('projects must be a real directory');
    } catch (error) {if (error.code !== 'ENOENT') throw error;}
  }
  const files = {};
  for (const name of ['README.md', 'assets.json', 'script.md', 'project.json', 'index.tsx', 'Video.tsx']) {
    let text = await fs.readFile(path.join(base, 'templates', name), 'utf8');
    if (name === 'project.json') {
      const data = JSON.parse(text); data.id = id; data.title = title;
      text = JSON.stringify(data, null, 2) + '\n';
    }
    files[name] = text;
  }
  const fonts = {};
  for (const name of ['NotoSansSC.ttf', 'OFL.txt', 'source.json']) {
    fonts[name] = await fs.readFile(path.join(base, 'public/fonts', name));
  }
  if (dryRun) return {dryRun: true, directory: path.relative(base, target), files: Object.keys(files)};
  await fs.mkdir(parent, {recursive: true});
  if (await fs.realpath(parent) !== parent) throw new Error('projects must not resolve outside the repository');
  await fs.mkdir(target); // Exclusive reservation, no replacement of an existing project.
  try {
    for (const [name, text] of Object.entries(files)) await fs.writeFile(path.join(target, name), text, {flag: 'wx'});
    for (const sub of ['source', 'derived', 'fonts']) await fs.mkdir(path.join(target, 'assets', sub), {recursive: true});
    for (const [name, bytes] of Object.entries(fonts)) await fs.writeFile(path.join(target, 'assets/fonts', name), bytes, {flag: 'wx'});
  } catch (error) {
    throw new Error(`Project creation incomplete: ${target}. Files were retained. Inspect this directory, fix the I/O problem, and use a new ID; no automatic deletion or overwrite.`, {cause: error});
  }
  return {directory: path.relative(base, target), next: 'Fill the brief, asset ledger, script, project.json and Video.tsx before rendering.'};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const {values, positionals} = parseArgs({allowPositionals: true, options: {
    title: {type: 'string'}, 'dry-run': {type: 'boolean', default: false},
  }});
  if (positionals.length !== 1 || !values.title) throw new Error('Usage: npm run new -- my-intro --title "新介绍视频" [--dry-run]');
  console.log(JSON.stringify(await createProject(root, positionals[0], values.title, values['dry-run']), null, 2));
}
