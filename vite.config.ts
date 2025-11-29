import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Use relative base path so it works in subdirectories on GitHub Pages
    base: './',
    define: {
      // Maps process.env.API_KEY in the code to VITE_API_KEY from .env file during build
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
  };
});