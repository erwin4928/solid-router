import { resolve } from 'path'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig((env) => {
  return {
    build: {
      target: 'esnext',
      modulePreload: false,
      sourcemap: true,
      rollupOptions: {
        external: ['solid-js', 'solid-js/web', 'solid-js/store', 'solid-js/h', 'solid-js/html', 'solid-js/universal'],
      },
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index',
      },
      reportCompressedSize: false,
    },
    plugins: [
      solid(),
    ],
  }
})
