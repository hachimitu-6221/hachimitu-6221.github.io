// highlight.js 11.6.0 exports ESM grammars without individual declaration files.
declare module 'highlight.js/lib/languages/*' {
  import type { LanguageFn } from 'highlight.js'
  const language: LanguageFn
  export default language
}
