import { createServer } from 'vite';
import { after } from 'node:test';

let viteServer = null;

/**
 * Returns a shared Vite dev server instance for SSR module loading.
 */
export async function getViteServer() {
  if (!viteServer) {
    viteServer = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
    });
  }
  return viteServer;
}

/**
 * Loads a TypeScript or ESM source module using Vite's SSR pipeline.
 * Resolves path aliases, TypeScript types, and directory imports.
 * @param {string} relativePath - Path relative to project root (e.g. './src/utils/businessHours.ts')
 */
export async function loadSourceModule(relativePath) {
  const server = await getViteServer();
  return server.ssrLoadModule(relativePath);
}

/**
 * Safely closes the shared Vite server.
 */
export async function closeViteServer() {
  if (viteServer) {
    await viteServer.close();
    viteServer = null;
  }
}

// Automatically close the server after all tests in the current file complete
try {
  after(async () => {
    await closeViteServer();
  });
} catch {
  // If run outside of node:test runner context, ignore
}

