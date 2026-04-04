import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs'],
  dts: false,
  sourcemap: false,
  clean: true,
  // React and the SDK are provided by the host at runtime — don't bundle them
  external: ['react', 'react-dom', '@signalsandsorcery/plugin-sdk'],
  jsx: 'automatic',
});
