import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import './i18n'
import App from './App.tsx'
import { registerGlobalErrorHandlers } from '@/lib/observability/errorTracking'

registerGlobalErrorHandlers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
