import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' + HashRouter => works on GitHub Pages under any repo path with no server rewrites.
export default defineConfig({ base: './', plugins: [react()] });
