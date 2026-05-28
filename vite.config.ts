import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'VanillaSonner',
      fileName: (_format, entryName) => {
        if (entryName === 'style') return 'vanilla-sonner.css';
        return 'vanilla-sonner';
      },
      cssFileName: 'vanilla-sonner',
      formats: ['es', 'umd', 'iife'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
        entryFileNames: (chunk) => {
          const format = chunk.facadeModuleId?.includes('src/index.ts') ? '[format]' : '[name]';
          return `vanilla-sonner.${format}.js`;
        },
      },
    },
    sourcemap: true,
    target: 'es2020',
    emptyOutDir: false,
  },
});
