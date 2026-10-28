import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parsePost, collectPosts } from './build-content.mjs'

test('plain Markdown derives title, excerpt and Chinese slug without changing fenced code', () => {
  const post = parsePost('# 我的笔记\n\n第一段 **正文**。\n\n## 计算\n\n```cuda\n  kernel<<<1, 32>>>();\n```', 'posts/我的笔记.md', '2026-10-28')
  assert.equal(post.title, '我的笔记')
  assert.equal(post.slug, '我的笔记')
  assert.equal(post.date, '2026-10-28')
  assert.equal(post.excerpt, '第一段 正文。')
  assert.ok(post.body.startsWith('第一段'))
  assert.ok(post.body.includes('  kernel<<<1, 32>>>();'))
})

test('frontmatter validates dates and draft booleans before publishing', () => {
  const valid = parsePost('---\ntitle: Hello\ndate: 2026-10-28\ndraft: true\n---\n\ntext', 'posts/hello.md', '2020-01-01')
  assert.equal(valid.date, '2026-10-28')
  assert.equal(valid.draft, true)
  assert.throws(() => parsePost('---\ndate: "2026-02-30"\n---\nx', 'posts/bad.md', '2026-10-28'), /有效/)
  assert.throws(() => parsePost('---\ndate: 2026-02-30\n---\nx', 'posts/bad.md', '2026-10-28'), /有效/)
  assert.throws(() => parsePost('---\ndraft: "false"\n---\nx', 'posts/bad.md', '2026-10-28'), /draft/)
  assert.throws(() => parsePost('---\nslug: ../escape\n---\nx', 'posts/bad.md', '2026-10-28'), /slug/)
})

test('nested posts sort by date, exclude draft bodies and reject duplicate URLs', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'alioth-markdown-'))
  try {
    await mkdir(path.join(temporary, 'posts/nested'), { recursive: true })
    await writeFile(path.join(temporary, 'posts/old.md'), '---\ndate: 2026-01-01\n---\nold')
    await writeFile(path.join(temporary, 'posts/nested/new.md'), '---\ndate: 2026-10-28\n---\nnew')
    await writeFile(path.join(temporary, 'posts/draft.md'), '---\ndraft: true\n---\nprivate draft text')
    const posts = await collectPosts(temporary)
    assert.deepEqual(posts.map(post => post.slug), ['new', 'old'])
    assert.equal(posts[0].sourcePath, 'posts/nested/new.md')
    assert.ok(!JSON.stringify(posts).includes('private draft text'))
    await writeFile(path.join(temporary, 'posts/nested/old.md'), 'duplicate')
    await assert.rejects(collectPosts(temporary), /slug 重复/)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})
