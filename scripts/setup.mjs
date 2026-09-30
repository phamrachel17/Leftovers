#!/usr/bin/env node
// One-time local setup: checks Node, installs dependencies, and saves your
// Anthropic API key to .env (git-ignored). Safe to re-run.
import { execSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const ENV_FILE = '.env';
const KEY_NAME = 'ANTHROPIC_API_KEY';
const MODEL = 'claude-opus-5';

const say = (msg = '') => console.log(msg);
const ok = (msg) => say(`  ✓ ${msg}`);
const warn = (msg) => say(`  ! ${msg}`);

say('\nleftovers · local setup\n');

// 1. Node version (Vite needs ^20.19 or >=22.12).
const [major, minor] = process.versions.node.split('.').map(Number);
const nodeOk = (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22;
if (!nodeOk) {
  warn(`Node ${process.versions.node} is too old. Install Node 22 (e.g. \`brew install node\`) and run this again.`);
  process.exit(1);
}
ok(`Node ${process.versions.node}`);

// 2. Dependencies.
if (!existsSync('node_modules/.package-lock.json')) {
  say('  … installing dependencies');
  execSync('npm install', { stdio: 'inherit' });
}
ok('Dependencies installed');

// 3. API key.
const envText = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
const existing = envText.match(new RegExp(`^${KEY_NAME}=(.+)$`, 'm'))?.[1]?.trim();

let key = existing;
if (existing) {
  ok(`${KEY_NAME} found in ${ENV_FILE}`);
} else if (!process.stdin.isTTY) {
  saveKey('');
} else {
  say('\n  Scanning uses Claude. Two ways to power it:');
  say('   • Your Claude subscription, through Claude Code — free, only on this computer.');
  say('     Just press Enter.');
  say('   • An Anthropic API key (pay-as-you-go) — needed once other people use the app.');
  say('     Paste it (from https://console.anthropic.com/settings/keys).\n');
  key = (await askHidden('  API key: ')).trim();
  if (key) {
    saveKey(key);
    ok(`Saved to ${ENV_FILE} (git-ignored, readable only by you)`);
  } else {
    saveKey('');
  }
}

// 3b. No key: can we scan through Claude Code on the subscription instead?
if (!key) {
  const claude = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (claude.status === 0) {
    ok(`Claude Code ${claude.stdout.trim().split(' ')[0]} found — scans will use your Claude subscription`);
    say('    (If it isn’t signed in yet, run `claude` once and log in.)');
  } else {
    warn('No API key and no Claude Code, so scanning is off. Adding by hand still works.');
    say('    To scan on your subscription: `npm install -g @anthropic-ai/claude-code`, run `claude`, sign in,');
    say('    then run `npm run setup` again. Or add an API key to .env.');
  }
}

// 4. Check the key with a free call (no tokens used).
if (key) {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: key });
    await client.models.retrieve(MODEL);
    ok(`Key works — ${MODEL} is available`);
  } catch (error) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    if (error instanceof Anthropic.AuthenticationError) {
      warn('That key was rejected. Double-check it, then run `npm run setup` again.');
      saveKey('');
      process.exit(1);
    } else if (error instanceof Anthropic.NotFoundError || error instanceof Anthropic.PermissionDeniedError) {
      warn(`The key works, but this account can’t use ${MODEL} yet. Check your plan in the Anthropic Console.`);
    } else if (error instanceof Anthropic.APIConnectionError) {
      warn('Couldn’t reach the Anthropic API (offline?). The key is saved; scanning will work once you’re online.');
    } else {
      warn(`Couldn’t verify the key (${error instanceof Error ? error.message : error}). It’s saved anyway.`);
    }
  }
}

say('\n  All set. Start the app with:\n\n    npm run dev\n');

function saveKey(value) {
  const current = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : readFileSync('.env.example', 'utf8');
  const line = `${KEY_NAME}=${value}`;
  const next = new RegExp(`^${KEY_NAME}=.*$`, 'm').test(current)
    ? current.replace(new RegExp(`^${KEY_NAME}=.*$`, 'm'), line)
    : `${current.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_FILE, next);
  chmodSync(ENV_FILE, 0o600);
}

function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    const write = rl._writeToOutput?.bind(rl);
    // Echo the prompt, then hide what's typed.
    rl._writeToOutput = (s) => {
      if (!muted) write?.(s);
      else if (s.includes('\n')) write?.('\n');
    };
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}
