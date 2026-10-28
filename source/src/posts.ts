import generatedPosts from './generated/posts.json'

export type Post = {
  slug: string
  title: string
  date: string
  tag: string
  excerpt: string
  minutes: number
  body: string
  sourcePath: string
}

export const posts: Post[] = generatedPosts
export const postHref = (post: Post) => `#/post/${encodeURIComponent(post.slug)}`
export const getPost = (slug: string) => {
  try { return posts.find(post => post.slug === decodeURIComponent(slug)) } catch { return undefined }
}

// Resolve author-friendly paths relative to content/posts/<file>.md.
export function contentHref(href: string, post: Post) {
  if (!href || href.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return href
  let target: URL
  try { target = new URL(href, `https://content.invalid/${post.sourcePath}`) } catch { return href }
  let targetPath: string
  try { targetPath = decodeURIComponent(target.pathname.slice(1)) } catch { return href }
  const linkedPost = posts.find(item => item.sourcePath === targetPath)
  if (linkedPost) return postHref(linkedPost)
  if (targetPath.startsWith('images/')) return `${import.meta.env.BASE_URL}${targetPath}${target.search}${target.hash}`
  return href
}

export const formatDate = (date: string) => {
  const [year, month, day] = date.split('-')
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}
