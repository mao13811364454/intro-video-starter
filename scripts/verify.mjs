import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {parseArgs} from 'node:util';
const {values, positionals} = parseArgs({allowPositionals: true, options: {'expected-duration': {type: 'string'}}});
if (positionals.length !== 1) throw new Error('Usage: npm run verify -- out/demo.mp4 --expected-duration 18');
const file = path.resolve(positionals[0]);
const expected = values['expected-duration'] === undefined ? null : Number(values['expected-duration']);
if (expected !== null && (!Number.isFinite(expected) || expected <= 0)) throw new Error('Expected duration must be positive');
const result = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8', timeout: 60000}));
const video = result.streams.find(stream => stream.codec_type === 'video');
const audio = result.streams.find(stream => stream.codec_type === 'audio');
const duration = Number(result.format.duration);
const failures = [];
if (!video || video.codec_name !== 'h264' || video.pix_fmt !== 'yuv420p') failures.push('Expected H.264 / yuv420p video');
if (video?.width !== 1920 || video?.height !== 1080) failures.push('This v1 checker supports 1920×1080 only');
if (!Number.isFinite(duration) || duration <= 0) failures.push('Invalid duration');
if (expected !== null && Math.abs(duration - expected) > .1) failures.push('Duration differs by more than 0.1 s');
if (!audio || audio.codec_name !== 'aac') failures.push('Expected AAC audio');
try {execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-nostdin', '-i', file, '-f', 'null', '-'], {stdio: ['ignore', 'ignore', 'pipe'], timeout: 600000});}
catch {failures.push('Complete decode failed or exceeded 10 minutes');}
console.log(JSON.stringify({file: path.basename(file), duration, bytes: Number(result.format.size),
  video: video && {codec: video.codec_name, width: video.width, height: video.height, fps: video.avg_frame_rate, frames: video.nb_frames},
  audio: audio && {codec: audio.codec_name, sampleRate: audio.sample_rate, channels: audio.channels},
  failures, checked: 'Container, codecs, duration, dimensions and complete decoding only. Watch and listen to the entire output separately.'}, null, 2));
if (failures.length) process.exitCode = 1;
