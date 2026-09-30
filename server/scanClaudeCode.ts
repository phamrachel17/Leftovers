import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import type { ScanRequest, ScanResponse } from '../src/lib/types.ts';
import { SYSTEM, ScanError, instructionFor, sanitize, scanSchema } from './scanShared.ts';

/**
 * Local-only scanner that runs Claude Code headlessly (`claude -p`), so scans
 * count against your Claude subscription instead of API credits.
 * For your own machine while developing — real users need the API path.
 */

const TIMEOUT_MS = 180_000;
const NOT_SIGNED_IN = 'Claude Code isn’t signed in. Run `claude` in a terminal once, sign in, then try again.';

let available: Promise<boolean> | null = null;

/** Is the `claude` CLI installed? Checked once per server start. */
export function claudeCodeAvailable(): Promise<boolean> {
  available ??= new Promise((resolve) => {
    const child = spawn('claude', ['--version'], { stdio: 'ignore' });
    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
  return available;
}

interface ResultEvent {
  type: 'result';
  subtype: string;
  is_error: boolean;
  result?: string;
  structured_output?: unknown;
}

export async function scanWithClaudeCode(req: ScanRequest): Promise<ScanResponse> {
  const args = [
    '-p',
    '--verbose',
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--model', 'opus',
    '--system-prompt', SYSTEM,
    '--json-schema', JSON.stringify(scanSchema),
    // Just looking at a photo: no tools, no MCP servers, nothing saved.
    '--tools', '',
    '--strict-mcp-config',
    '--no-session-persistence',
  ];

  // Force the subscription login even if a (maybe empty) API key is in the environment.
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;

  // The photo goes in as a message on stdin, so nothing touches disk.
  const message = {
    type: 'user',
    message: {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: req.mediaType, data: req.data } },
        { type: 'text', text: instructionFor(req.kind) },
      ],
    },
  };

  const { stdout, stderr, code } = await run(args, env, JSON.stringify(message) + '\n');
  const result = findResult(stdout);

  if (!result) {
    if (/log ?in|logged in|sign in|authenticat|\/login/i.test(stderr + stdout)) throw new ScanError(NOT_SIGNED_IN, 503);
    console.error('[scan:claude-code] no result', { code, stderr: stderr.slice(0, 500) });
    throw new ScanError('Claude Code couldn’t read that image. Try again in a moment.', 502);
  }
  if (result.is_error || result.subtype !== 'success') {
    const text = result.result ?? '';
    if (/log ?in|logged in|sign in|authenticat|\/login/i.test(text)) throw new ScanError(NOT_SIGNED_IN, 503);
    if (/limit|usage|quota|rate/i.test(text)) {
      throw new ScanError('You’ve hit your Claude usage limit for now. Try again later, or add items by hand.', 429);
    }
    console.error('[scan:claude-code] error result', result.subtype, text.slice(0, 500));
    throw new ScanError('We couldn’t read that image.', 502);
  }

  let parsed = result.structured_output;
  if (parsed == null && result.result) {
    try {
      parsed = JSON.parse(result.result);
    } catch {
      throw new ScanError('We couldn’t make sense of that image.', 502);
    }
  }
  return { items: sanitize(parsed) };
}

function findResult(stdout: string): ResultEvent | null {
  // stream-json: one JSON event per line; the last "result" event is the answer.
  let found: ResultEvent | null = null;
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event?.type === 'result') found = event as ResultEvent;
    } catch {
      // Ignore non-JSON noise.
    }
  }
  return found;
}

function run(args: string[], env: NodeJS.ProcessEnv, input: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { cwd: tmpdir(), env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new ScanError('That took too long. Try a clearer or smaller photo.', 504));
    }, TIMEOUT_MS);

    child.stdout.on('data', (d: Buffer) => (stdout += d.toString('utf8')));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString('utf8')));
    child.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(
        err.code === 'ENOENT'
          ? new ScanError('Claude Code isn’t installed, so scanning is off. Run `npm run setup` for options.', 503)
          : err,
      );
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
    child.stdin.end(input);
  });
}
