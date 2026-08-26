import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './contexts/SettingsContext.tsx'

// Force an immediate reload the moment a new deploy is detected, instead of only swapping the
// service worker in the background — otherwise an already-open tab (or a home-screen PWA that
// was never fully closed) keeps running the old JS bundle indefinitely.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)
