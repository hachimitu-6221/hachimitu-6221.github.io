import { isValidElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { ArrowLeft, ArrowRight, ArrowUp, Check, Copy, Moon, Search, Sun, X } from 'lucide-react'
import { contentHref, formatDate, getPost, postHref, posts, type Post } from './posts'

function currentRoute() {
  return window.location.hash.replace(/^#/, '') || '/'
}

function postText(post: Post) {
  return [post.title, post.excerpt, post.tag, post.body].join(' ').toLowerCase()
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('yiyewiki-theme') === 'dark' } catch { return false }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    try { localStorage.setItem('yiyewiki-theme', dark ? 'dark' : 'light') } catch { /* Private/file contexts may disable storage. */ }
  }, [dark])
  return <button className="theme-toggle" type="button" onClick={() => setDark(!dark)} aria-label={dark ? '切换浅色主题' : '切换深色主题'} title={dark ? '浅色主题' : '深色主题'}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
}

function SiteHeader({ route, onSearch }: { route: string; onSearch: () => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#/" aria-label="Alioth's wiki 首页">Alioth<span>'s wiki</span></a>
        <span className="header-note">AI Infra · 研究生在读</span>
        <nav className="site-nav" aria-label="主导航">
          <a href="#/" aria-current={route === '/' ? 'page' : undefined}>首页</a>
          <a href="#/archive" aria-current={route === '/archive' ? 'page' : undefined}>归档</a>
          <a href="#/about" aria-current={route === '/about' ? 'page' : undefined}>关于</a>
          <button id="site-search" className="search-trigger" type="button" onClick={onSearch} aria-label="搜索文章">
            <Search size={17} strokeWidth={1.8} aria-hidden="true" />
            <span className="search-label">搜索</span>
            <kbd>/</kbd>
          </button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

function PostList({ items }: { items: Post[] }) {
  return (
    <ul className="post-list">
      {items.map((post) => (
        <li key={post.slug}>
          <a href={postHref(post)}>{post.title}</a>
          <span className="post-date">{post.date}</span>
        </li>
      ))}
    </ul>
  )
}

function HomePage() {
  return (
    <div className="page home-page">
      <h1 className="handwritten">Alioth's wiki</h1>
      <p className="lead">你好，我是 Alioth，一名 AI Infra 方向的在读研究生。</p>
      <section aria-labelledby="intro-title">
        <h2 id="intro-title">最近文章</h2>
        <PostList items={posts} />
      </section>
      <section aria-labelledby="site-title">
        <h2 id="site-title">这个站点</h2>
        <p>这里是我的个人 Wiki，用来记录 AI Infra 方向的学习与思考。</p>
      </section>
    </div>
  )
}

function ArchivePage() {
  const initialTag = new URLSearchParams(currentRoute().split('?')[1] ?? '').get('tag') ?? ''
  const [filter, setFilter] = useState(initialTag)
  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase()
    return query ? posts.filter((post) => postText(post).includes(query)) : posts
  }, [filter])
  const years = [...new Set(filtered.map((post) => post.date.slice(0, 4)))]

  return (
    <div className="page archive-page">
      <h1>文章归档</h1>
      <p>所有文章按时间倒序排列。也可以输入标题、主题或正文里的关键词。</p>
      <div className="archive-filter">
        <label className="sr-only" htmlFor="archive-search">筛选文章</label>
        <Search size={17} aria-hidden="true" />
        <input id="archive-search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="筛选文章……" type="search" />
        {filter && <button type="button" onClick={() => setFilter('')} aria-label="清空筛选"><X size={17} /></button>}
      </div>
      <div className="tag-filters" aria-label="按主题筛选">
        <button type="button" aria-pressed={!filter} onClick={() => setFilter('')}>全部 <span>{posts.length}</span></button>
        {[...new Set(posts.map(post => post.tag))].map(tag => <button key={tag} type="button" aria-pressed={filter === tag} onClick={() => setFilter(tag)}>{tag} <span>{posts.filter(post => post.tag === tag).length}</span></button>)}
      </div>
      <p className="result-count" aria-live="polite">找到 {filtered.length} 篇文章</p>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>没有找到包含“{filter}”的文章。</p>
          <button className="text-button" type="button" onClick={() => setFilter('')}>清空筛选，查看全部</button>
        </div>
      ) : years.map((year) => (
        <section key={year} aria-labelledby={`year-${year}`}>
          <h2 id={`year-${year}`}>{year}</h2>
          <PostList items={filtered.filter((post) => post.date.startsWith(year))} />
        </section>
      ))}
    </div>
  )
}

function AboutPage() {
  return (
    <div className="page about-page">
      <h1>关于 Alioth</h1>
      <p>你好，我是 Alioth，一名 AI Infra 方向的在读研究生。</p>
      <h2 id="about-site">关于这个站点</h2>
      <p>Alioth's wiki 是我的个人 Wiki，用来记录学习与思考。</p>
      <p><a href="#/post/hello-alioth">阅读自我介绍 →</a></p>
    </div>
  )
}

function CodeBlock({ code, language = 'text' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const codeRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        throw new Error('Clipboard unavailable')
      }
      setCopied(true)
      setFailed(false)
    } catch {
      const selection = window.getSelection()
      const range = document.createRange()
      if (codeRef.current) {
        range.selectNodeContents(codeRef.current)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
      setFailed(true)
    }
  }
  return <div className="code-block"><div className="code-toolbar"><span>{language.toUpperCase()}</span><button type="button" onClick={copy} aria-label={copied ? '代码已复制' : '复制代码'}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? '已复制' : '复制'}</button></div><pre><code ref={codeRef}>{code}</code></pre><span className="sr-only" role="status">{copied ? '代码已复制' : failed ? '代码已选中，请按 Command+C 或 Ctrl+C 复制' : ''}</span>{failed && <p className="copy-notice">代码已选中，请按 ⌘C / Ctrl+C 复制。</p>}</div>
}

function ArticlePage({ post }: { post: Post }) {
  const index = posts.findIndex((item) => item.slug === post.slug)
  const newer = index > 0 ? posts[index - 1] : undefined
  const older = index < posts.length - 1 ? posts[index + 1] : undefined
  const bodyRef = useRef<HTMLDivElement>(null)
  const [headings, setHeadings] = useState<{ id: string; title: string; level: number }[]>([])

  useEffect(() => {
    setHeadings(Array.from(bodyRef.current?.querySelectorAll<HTMLElement>('h2[id], h3[id]') ?? []).map(node => ({ id: node.id, title: node.innerText, level: Number(node.tagName.slice(1)) })))
  }, [post])

  const scrollToSection = (id: string) => {
    let decoded = id
    try { decoded = decodeURIComponent(id) } catch { /* Keep the literal anchor. */ }
    const node = document.getElementById(decoded) ?? document.getElementById(`heading-${decoded}`)
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <article className="page article-page">
      <a className="back-link" href="#/archive"><ArrowLeft size={15} aria-hidden="true" />返回文章归档</a>
      <h1>{post.title}</h1>
      <p className="article-meta">{formatDate(post.date)} · <a href={`#/archive?tag=${encodeURIComponent(post.tag)}`}>{post.tag}</a> · 约 {post.minutes} 分钟</p>
      <p className="article-excerpt">{post.excerpt}</p>
      {headings.length > 0 && <details className="article-toc">
        <summary>本文目录</summary>
        <ol>
          {headings.map(heading => <li key={heading.id} className={heading.level === 3 ? 'toc-nested' : undefined}><button type="button" onClick={() => scrollToSection(heading.id)}>{heading.title}</button></li>)}
        </ol>
      </details>}
      <div className="article-body" ref={bodyRef}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSlug, { prefix: 'heading-' }]]} components={{
          pre: ({ children }) => {
            const child = isValidElement<{ children?: ReactNode; className?: string }>(children) ? children : undefined
            const code = String(child?.props.children ?? '').replace(/\n$/, '')
            const language = child?.props.className?.match(/language-([^\s]+)/)?.[1]
            return <CodeBlock code={code} language={language} />
          },
          table: ({ children }) => <div className="markdown-table"><table>{children}</table></div>,
          a: ({ href = '', children, title }) => <a href={contentHref(href, post)} title={title} onClick={event => {
            if (href.startsWith('#') && !href.startsWith('#/')) { event.preventDefault(); scrollToSection(href.slice(1)) }
          }}>{children}</a>,
          img: ({ src = '', alt, title }) => <img src={contentHref(src, post)} alt={alt ?? ''} title={title} loading="lazy" />,
        }}>{post.body}</ReactMarkdown>
      </div>
      <nav className="article-neighbors" aria-label="相邻文章">
        {older ? <a href={postHref(older)}><span><ArrowLeft size={14} aria-hidden="true" />上一篇</span>{older.title}</a> : <span />}
        {newer && <a className="next-post" href={postHref(newer)}><span>下一篇<ArrowRight size={14} aria-hidden="true" /></span>{newer.title}</a>}
      </nav>
    </article>
  )
}

function NotFoundPage() {
  return (
    <div className="page">
      <h1>没有找到这一页</h1>
      <p>链接可能已经改变，也可能这篇文章还没有写。</p>
      <p><a href="#/">返回首页</a>，或者去 <a href="#/archive">文章归档</a> 看看。</p>
    </div>
  )
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    return value ? posts.filter((post) => postText(post).includes(value)) : posts.slice(0, 5)
  }, [query])

  useEffect(() => {
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => { document.body.style.overflow = oldOverflow }
  }, [])

  const handleKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClose()
    if (event.key === 'Enter' && event.target === inputRef.current && results[0]) {
      window.location.hash = `/post/${encodeURIComponent(results[0].slug)}`
      onClose()
    }
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('input, button, a[href]')
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="search-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title" ref={dialogRef} onKeyDown={handleKeys}>
        <div className="search-dialog-head">
          <h2 id="search-title">搜索文章</h2>
          <button type="button" onClick={onClose} aria-label="关闭搜索"><X size={20} /></button>
        </div>
        <div className="search-input-wrap">
          <Search size={19} aria-hidden="true" />
          <input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入标题、主题或正文关键词" aria-label="搜索关键词" />
          <kbd>Esc</kbd>
        </div>
        <p className="search-hint" aria-live="polite">{query ? `找到 ${results.length} 篇相关文章` : '最近文章'}</p>
        <div className="search-results">
          {results.length ? results.map((post) => (
            <a key={post.slug} href={postHref(post)} onClick={onClose}>
              <span className="search-result-title">{post.title}</span>
              <span className="search-result-meta">{post.date} · {post.tag}</span>
              <span className="search-result-excerpt">{post.excerpt}</span>
            </a>
          )) : (
            <div className="search-empty">
              <p>没有找到相关内容，换一个关键词试试。</p>
              <button className="text-button" type="button" onClick={() => setQuery('')}>清空关键词</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PageOutline({ route }: { route: string }) {
  const [headings, setHeadings] = useState<{ id: string; title: string }[]>([])
  const [active, setActive] = useState('')
  useEffect(() => {
    let nodes: HTMLElement[] = []
    const update = () => {
      const current = [...nodes].reverse().find(node => node.getBoundingClientRect().top <= 150) ?? nodes[0]
      setActive(current?.id ?? '')
    }
    const collect = () => {
      nodes = Array.from(document.querySelectorAll<HTMLElement>('#main-content h2[id]'))
      const next = nodes.map(node => ({ id: node.id, title: node.innerText }))
      setHeadings(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
      update()
    }
    collect()
    const observer = new MutationObserver(collect)
    const main = document.getElementById('main-content')
    if (main) observer.observe(main, { childList: true, subtree: true })
    window.addEventListener('scroll', update, { passive: true })
    return () => { observer.disconnect(); window.removeEventListener('scroll', update) }
  }, [route])
  if (!headings.length) return null
  return <aside className="page-outline" aria-label="本页目录"><p>ON THIS PAGE</p><ol>{headings.map(heading => <li key={heading.id}><button type="button" aria-current={active === heading.id ? 'location' : undefined} onClick={() => { document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' }); setActive(heading.id) }}>{heading.title}</button></li>)}</ol><span className="outline-note">一点点写，慢慢来。</span></aside>
}

function ReadingProgress({ route }: { route: string }) {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${total > 0 ? Math.min(1, window.scrollY / total) : 0})`
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [route])
  return <div className="reading-progress" ref={bar} aria-hidden="true" />
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <span>© 2026 Alioth's wiki</span>
        <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans" target="_blank" rel="noreferrer">CC BY-NC 4.0</a>
        <a href="https://jyywiki.cn/" target="_blank" rel="noreferrer">风格参考</a>
      </div>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>回到顶部<ArrowUp size={14} aria-hidden="true" /></button>
    </footer>
  )
}

export default function App() {
  const [route, setRoute] = useState(currentRoute)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    setSearchOpen(false)
    const slug = route.startsWith('/post/') ? route.split('/')[2] : ''
    const post = slug ? getPost(slug) : undefined
    document.title = post ? `${post.title} · Alioth's wiki` : route.split('?')[0] === '/archive' ? "文章归档 · Alioth's wiki" : route === '/about' ? "关于 · Alioth's wiki" : "Alioth's wiki"
  }, [route])

  useEffect(() => {
    const openWithKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      if ((event.key === '/' && !isTyping) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', openWithKeyboard)
    return () => window.removeEventListener('keydown', openWithKeyboard)
  }, [])

  const closeSearch = () => {
    setSearchOpen(false)
    window.setTimeout(() => document.getElementById('site-search')?.focus(), 0)
  }

  const baseRoute = route.split('?')[0]
  const slug = baseRoute.startsWith('/post/') ? baseRoute.slice('/post/'.length) : ''
  const post = slug ? getPost(slug) : undefined
  let content
  if (baseRoute === '/') content = <HomePage />
  else if (baseRoute === '/archive') content = <ArchivePage key={route} />
  else if (baseRoute === '/about') content = <AboutPage />
  else if (post) content = <ArticlePage key={post.slug} post={post} />
  else content = <NotFoundPage />

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>跳至正文</a>
      <ReadingProgress route={route} />
      <SiteHeader route={baseRoute} onSearch={() => setSearchOpen(true)} />
      <main id="main-content" tabIndex={-1}>{content}</main>
      <PageOutline key={route} route={route} />
      <SiteFooter />
      {searchOpen && <SearchDialog onClose={closeSearch} />}
    </div>
  )
}
