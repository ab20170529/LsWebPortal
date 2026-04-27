import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@lserp/auth': fileURLToPath(
        new URL('../../packages/platform/auth/src/index.tsx', import.meta.url),
      ),
      '@lserp/bi': fileURLToPath(
        new URL('../../packages/products/bi/src/index.tsx', import.meta.url),
      ),
      '@lserp/contracts': fileURLToPath(
        new URL('../../packages/schema/contracts/src/index.ts', import.meta.url),
      ),
      '@lserp/designer': fileURLToPath(
        new URL('../../packages/studio/designer/src/index.tsx', import.meta.url),
      ),
      '@lserp/erp': fileURLToPath(
        new URL('../../packages/products/erp/src/index.tsx', import.meta.url),
      ),
      '@lserp/project': fileURLToPath(
        new URL('../../packages/products/project/src/index.tsx', import.meta.url),
      ),
      '@lserp/http': fileURLToPath(
        new URL('../../packages/platform/http/src/index.ts', import.meta.url),
      ),
      '@lserp/renderer-react': fileURLToPath(
        new URL('../../packages/renderer/react/src/index.tsx', import.meta.url),
      ),
      '@lserp/runtime-actions': fileURLToPath(
        new URL('../../packages/runtime/actions/src/index.ts', import.meta.url),
      ),
      '@lserp/runtime-core': fileURLToPath(
        new URL('../../packages/runtime/core/src/index.ts', import.meta.url),
      ),
      '@lserp/runtime-datasource': fileURLToPath(
        new URL('../../packages/runtime/datasource/src/index.ts', import.meta.url),
      ),
      '@lserp/runtime-expression': fileURLToPath(
        new URL('../../packages/runtime/expression/src/index.ts', import.meta.url),
      ),
      '@lserp/runtime-permission': fileURLToPath(
        new URL('../../packages/runtime/permission/src/index.ts', import.meta.url),
      ),
      '@lserp/runtime-store': fileURLToPath(
        new URL('../../packages/runtime/store/src/index.tsx', import.meta.url),
      ),
      '@lserp/runtime-validation': fileURLToPath(
        new URL('../../packages/runtime/validation/src/index.ts', import.meta.url),
      ),
      '@lserp/tokens': fileURLToPath(
        new URL('../../packages/platform/tokens/src/index.tsx', import.meta.url),
      ),
      '@lserp/ui': fileURLToPath(
        new URL('../../packages/platform/ui/src/index.tsx', import.meta.url),
      ),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 9001,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});
