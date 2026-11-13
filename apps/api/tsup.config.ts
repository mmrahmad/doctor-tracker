import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/scripts/seed-database.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // The contracts package ships TypeScript source, so it is bundled into the API output.
  noExternal: ['@doctor-tracker/contracts'],
});
