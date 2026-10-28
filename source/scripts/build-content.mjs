import { readdir, readFile, writeFile, mkdir, cp, rm, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import matter from 'gray-matter'
import * as yaml from 'js-yaml'

export const contentRoot = fileURLToPath(new URL('../../content/', import.meta.url))
const sourceRoot = fileURLToPath(new URL('../', import.meta.url))

function plainText(text) {
  return text.replace(/```[^\n]*\n[\s\S]*?```/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`~>|]/g, '').replace(/\s+/g, ' ').trim()
}

export function parsePost(raw, sourcePath, fallbackDate) {
  const { data, content } = matter(raw, { engines: {
    yaml: text => yaml.load(text, { schema: yaml.JSON_SCHEMA }) ?? {},
    javascript: () => { throw new Error(`${sourcePath}: 文件头请使用 YAML，不支持 JavaScript`) },
  } })
  const fail = (message) => { throw new Error(`${sourcePath}: ${message}`) }
  const filename = path.posix.basename(sourcePath, '.md')
  const heading = content.trimStart().match(/^#\s+(.+?)(?:\s+#+)?(?:\r?\n|$)/)
  const title = data.title ?? heading?.[1] ?? filename
  const slug = data.slug ?? filename
  if (typeof title !== 'string' || !title.trim()) fail('title 必须是非空字符串')
  if (typeof slug !== 'string' || !/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(slug)) {
    fail('slug/文件名只能包含文字、数字、连字符和下划线，且以文字或数字开头')
  }
  if (data.draft !== undefined && typeof data.draft !== 'boolean') fail('draft 必须是 true 或 false（不要加引号）')
  const dateValue = data.date ?? filename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? fallbackDate
  const date = dateValue instanceof Date ? dateValue.toISOString().slice(0, 10) : dateValue
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) fail('date 请使用有效的 YYYY-MM-DD 日期')
  const tag = data.tag ?? '随笔'
  if (typeof tag !== 'string' || !tag.trim()) fail('tag 必须是非空字符串')
  const body = heading ? content.trimStart().slice(heading[0].length).trim() : content.trim()
  const excerpt = data.excerpt ?? plainText(body.split(/\n\s*\n/).find(part => !/^\s*(#|```)/.test(part)) ?? body).slice(0, 100)
  if (typeof excerpt !== 'string') fail('excerpt 必须是字符串')
  const words = (body.match(/[\u3400-\u9fff]|[a-zA-Z0-9_]+/g) ?? []).length
  return { slug, title: title.trim(), date, tag: tag.trim(), excerpt, minutes: Math.max(1, Math.ceil(words / 300)), body, sourcePath, draft: data.draft === true }
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const groups = await Promise.all(entries.map(entry => {
    const filename = path.join(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(filename) : entry.isFile() && entry.name.endsWith('.md') ? [filename] : []
  }))
  return groups.flat().sort()
}

export async function collectPosts(directory = contentRoot) {
  const files = await markdownFiles(path.join(directory, 'posts'))
  const posts = []
  const slugs = new Set()
  for (const filename of files) {
    const sourcePath = path.relative(directory, filename).split(path.sep).join('/')
    let fallbackDate
    try {
      fallbackDate = execFileSync('git', ['log', '-1', '--format=%cs', '--', filename], { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    } catch { /* Untracked files use the local modification date. */ }
    fallbackDate ||= (await stat(filename)).mtime.toISOString().slice(0, 10)
    const post = parsePost(await readFile(filename, 'utf8'), sourcePath, fallbackDate)
    if (slugs.has(post.slug)) throw new Error(`${sourcePath}: slug 重复：${post.slug}`)
    slugs.add(post.slug)
    if (!post.draft) {
      const { draft: _draft, ...published } = post
      posts.push(published)
    }
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
}

export async function buildContent() {
  const posts = await collectPosts()
  const generated = path.join(sourceRoot, 'src/generated/posts.json')
  await mkdir(path.dirname(generated), { recursive: true })
  const json = JSON.stringify(posts, null, 2) + '\n'
  const previous = await readFile(generated, 'utf8').catch(() => '')
  if (json !== previous) await writeFile(generated, json)
  const images = path.join(sourceRoot, 'public/images')
  await rm(images, { recursive: true, force: true })
  await cp(path.join(contentRoot, 'images'), images, { recursive: true, filter: file => path.basename(file) !== '.gitkeep' })
  console.log(`Markdown: ${posts.length} 篇已发布文章（草稿已排除）`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await buildContent()
}
