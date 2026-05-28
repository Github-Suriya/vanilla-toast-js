import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'VanillaToast',
      fileName: (_format, entryName) => {
        if (entryName === 'style') return 'vanilla-toast.css';
        return 'vanilla-toast';
      },
      cssFileName: 'vanilla-toast',
      formats: ['es', 'umd', 'iife'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
        entryFileNames: (chunk) => {
          const format = chunk.facadeModuleId?.includes('src/index.ts') ? '[format]' : '[name]';
          return `vanilla-toast.${format}.js`;
        },
      },
    },
    sourcemap: true,
    target: 'es2020',
    emptyOutDir: false,
  },
});
