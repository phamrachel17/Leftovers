import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { scanApi } from './server/vitePlugin.ts';

export default defineConfig(({ mode }) => {
  // Expose scanner settings from .env to the dev server only (never to the client bundle).
  const env = loadEnv(mode, process.cwd(), '');
  for (const name of ['ANTHROPIC_API_KEY', 'LEFTOVERS_SCANNER']) {
    if (env[name] && !process.env[name]) process.env[name] = env[name];
  }
  return {
    plugins: [react(), scanApi()],
  };
});
