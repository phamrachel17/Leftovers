import type { ScanRequest, ScanResponse } from '../src/lib/types.ts';
import { scanWithApi } from './scanApi.ts';
import { claudeCodeAvailable, scanWithClaudeCode } from './scanClaudeCode.ts';
import { ScanError } from './scanShared.ts';

export { ScanError };

export type Scanner = 'api' | 'claude-code' | 'none';

/**
 * Which scanner to use. LEFTOVERS_SCANNER=api|claude-code forces one;
 * otherwise an API key wins, then Claude Code (your subscription), then none.
 */
export async function activeScanner(): Promise<Scanner> {
  const forced = process.env.LEFTOVERS_SCANNER;
  if (forced === 'api' || forced === 'claude-code') return forced;
  if (process.env.ANTHROPIC_API_KEY) return 'api';
  if (await claudeCodeAvailable()) return 'claude-code';
  return 'none';
}

export async function scanImage(req: ScanRequest): Promise<ScanResponse> {
  switch (await activeScanner()) {
    case 'api':
      return scanWithApi(req);
    case 'claude-code':
      return scanWithClaudeCode(req);
    case 'none':
      throw new ScanError('Scanning isn’t set up yet. Run `npm run setup`, then restart the app. Adding by hand still works.', 503);
  }
}
