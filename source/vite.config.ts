import path from 'node:path'
import { execFileSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'markdown-content',
    configureServer(server) {
      const content = path.resolve(__dirname, '../content')
      server.watcher.add(content)
      let timer: ReturnType<typeof setTimeout>
      const rebuild = (filename: string) => {
        if (!filename.startsWith(content + path.sep)) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          try {
            execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: __dirname, stdio: 'inherit' })
            server.ws.send({ type: 'full-reload' })
          } catch {
            server.config.logger.error('Markdown 内容构建失败，请检查终端中的文件名与错误。')
          }
        }, 100)
      }
      server.watcher.on('add', rebuild).on('change', rebuild).on('unlink', rebuild)
      server.httpServer?.once('close', () => {
        clearTimeout(timer)
        server.watcher.off('add', rebuild).off('change', rebuild).off('unlink', rebuild)
      })
    },
  }],
  build: {
    assetsInlineLimit: Infinity,
    modulePreload: false,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
  server: { port: 3000 },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
