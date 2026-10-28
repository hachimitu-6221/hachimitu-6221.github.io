export type PostSection = {
  id: string
  title: string
  paragraphs: string[]
  list?: string[]
  code?: string
}

export type Post = {
  slug: string
  title: string
  date: string
  tag: string
  excerpt: string
  minutes: number
  sections: PostSection[]
}

export const posts: Post[] = [
  {
    slug: 'hello-alioth',
    title: '你好，我是 Alioth',
    date: '2026-10-28',
    tag: '关于',
    excerpt: 'AI Infra 方向研究生在读中。',
    minutes: 1,
    sections: [
      {
        id: 'about-me',
        title: '关于我',
        paragraphs: ['你好，我是 Alioth，一名 AI Infra 方向的在读研究生。'],
      },
      {
        id: 'about-wiki',
        title: '关于这个 Wiki',
        paragraphs: ["欢迎来到 Alioth's wiki。这里用来记录 AI Infra 方向的学习与思考。"],
      },
    ],
  },
]

export const getPost = (slug: string) => posts.find((post) => post.slug === slug)

export const formatDate = (date: string) => {
  const [year, month, day] = date.split('-')
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}
