import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createProject} from '../scripts/new-project.mjs';
import {root, writeNewOrIdentical} from '../scripts/prepare-assets.mjs';

async function fixture(run) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'intro-project-test-'));
  try {
    await fs.cp(path.join(root, 'templates'), path.join(dir, 'templates'), {recursive: true});
    await fs.mkdir(path.join(dir, 'public/fonts'), {recursive: true});
    for (const name of ['NotoSansSC.ttf', 'OFL.txt', 'source.json']) await fs.writeFile(path.join(dir, 'public/fonts', name), 'fixture');
    await run(dir);
  } finally {await fs.rm(dir, {recursive: true, force: true});}
}

test('independent projects, pending specs, title remains JSON data', () => fixture(async dir => {
  const title = '中文 "标题" ` ${notCode}';
  await createProject(dir, 'alpha-film', title);
  await createProject(dir, 'beta-film', '第二部');
  const config = JSON.parse(await fs.readFile(path.join(dir, 'projects/alpha-film/project.json')));
  assert.equal(config.title, title);
  for (const field of ['width', 'height', 'fps', 'durationInFrames']) assert.equal(config[field], null);
  assert.ok(!(await fs.readFile(path.join(dir, 'projects/alpha-film/Video.tsx'), 'utf8')).includes(title));
  assert.ok((await fs.stat(path.join(dir, 'projects/alpha-film/assets/fonts/OFL.txt'))).isFile());
}));
test('existing project and original contents remain untouched', () => fixture(async dir => {
  await createProject(dir, 'alpha-film', 'Original');
  await assert.rejects(createProject(dir, 'alpha-film', 'Replacement'), /already exists/);
  assert.equal(JSON.parse(await fs.readFile(path.join(dir, 'projects/alpha-film/project.json'))).title, 'Original');
}));
test('invalid IDs and multiline titles cannot create paths', () => fixture(async dir => {
  for (const id of ['../escape', '/tmp/escape', 'bad/name', 'a', '-bad', 'bad-', 'MixedCase']) await assert.rejects(createProject(dir, id, 'Title'), /ID:/);
  await assert.rejects(createProject(dir, 'valid-id', 'line\nbreak'), /single-line/);
  await assert.rejects(fs.stat(path.join(dir, 'projects')), {code: 'ENOENT'});
}));
test('dry run writes nothing', () => fixture(async dir => {
  assert.equal((await createProject(dir, 'alpha-film', 'Title', true)).dryRun, true);
  await assert.rejects(fs.stat(path.join(dir, 'projects')), {code: 'ENOENT'});
}));
test('symlink parent is rejected', () => fixture(async dir => {
  await fs.mkdir(path.join(dir, 'outside'));
  await fs.symlink(path.join(dir, 'outside'), path.join(dir, 'projects'));
  await assert.rejects(createProject(dir, 'alpha-film', 'Title'), /real directory/);
  assert.deepEqual(await fs.readdir(path.join(dir, 'outside')), []);
}));
test('asset generation is repeatable but preserves user edits', () => fixture(async dir => {
  const file = path.join(dir, 'asset.txt');
  await writeNewOrIdentical(file, 'original'); await writeNewOrIdentical(file, 'original');
  await assert.rejects(writeNewOrIdentical(file, 'replacement'), /Refusing/);
  assert.equal(await fs.readFile(file, 'utf8'), 'original');
}));
test('partial I/O failure retains files and explains recovery', t => fixture(async dir => {
  const original = fs.writeFile;
  const mocked = t.mock.method(fs, 'writeFile', async (file, ...args) => {
    if (String(file).includes('projects/failure-test/assets/fonts/NotoSansSC.ttf')) {
      throw Object.assign(new Error('Simulated disk full'), {code: 'ENOSPC'});
    }
    return original(file, ...args);
  });
  await assert.rejects(createProject(dir, 'failure-test', 'Retained'), error => {
    assert.match(error.message, /creation incomplete.*Files were retained/);
    assert.equal(error.cause.code, 'ENOSPC');
    return true;
  });
  mocked.mock.restore();
  const config = JSON.parse(await fs.readFile(path.join(dir, 'projects/failure-test/project.json')));
  assert.equal(config.title, 'Retained');
  await assert.rejects(createProject(dir, 'failure-test', 'Replacement'), /already exists/);
}));
