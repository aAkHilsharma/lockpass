import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Keep WXT's dev server off the API's port (3001) and the web app's (3000).
  dev: { server: { port: 3014 } },
  // Auto-imports inject `import { storage } from 'wxt/utils/storage'` whenever
  // it sees a bare `storage` identifier — which collides with our own code and
  // bundled deps. Prefer explicit imports.
  imports: false,
  manifest: {
    name: 'LockPass',
    description: 'Encrypted before it leaves your device.',
    permissions: ['storage', 'scripting', 'activeTab', 'alarms', 'offscreen'],
    // API origin (autofill host_permissions added in Phase 3).
    host_permissions: ['http://localhost:3001/*'],
    action: {},
  },
});
