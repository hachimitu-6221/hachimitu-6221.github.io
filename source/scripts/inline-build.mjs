import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// A classic, self-contained script works over file:// as well as HTTP.
// Keep every font and stylesheet local: the exported page needs no CDN or server.
const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, 'dist/index.html')
let html = await readFile(output, 'utf8')
const localFile = (url) => {
  const filename = path.resolve(root, 'dist', url.replace(/^\//, ''))
  if (!filename.startsWith(path.join(root, 'dist') + path.sep)) throw new Error('Asset outside dist')
  return filename
}

for (const match of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)) {
  const css = await readFile(localFile(match[1]), 'utf8')
  html = html.replace(match[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`)
}
for (const match of html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)) {
  const js = await readFile(localFile(match[1]), 'utf8')
  if (/\bimport\s*\(/.test(js)) throw new Error('The portable build must not contain dynamic imports')
  // Vite puts module scripts in <head>; classic inline scripts must run after #root exists.
  html = html.replace(match[0], '')
  html = html.replace('</body>', () => `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>\n</body>`)
}
html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')
await writeFile(output, html)
const copyIndex = process.argv.indexOf('--copy-to')
{
  const targetArg = copyIndex === -1 ? '../index.html' : process.argv[copyIndex + 1]
  if (!targetArg) throw new Error('--copy-to needs a target HTML file')
  const target = path.resolve(root, targetArg)
  await mkdir(path.dirname(target), { recursive: true })
  await copyFile(output, target)
  console.log(`Portable page copied to ${target}`)
}
console.log(`Self-contained HTML: ${Math.round(Buffer.byteLength(html) / 1024)} KB`)
