import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/merienda-one/latin-400.css'
import '@fontsource/kalam/latin-400.css'
import '@fontsource/kalam/latin-700.css'
import '@fontsource/fira-mono/latin-400.css'
import '@fontsource/fira-mono/latin-700.css'
import './code-highlight.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
