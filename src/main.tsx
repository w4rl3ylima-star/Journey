import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './contexts/SettingsContext.tsx'

// Force an immediate reload the moment a new deploy is detected, instead of only swapping the
// service worker in the background — otherwise an already-open tab (or a home-screen PWA that
// was never fully closed) keeps running the old JS bundle indefinitely.
//
// Two things have to happen, and getting either wrong silently no-ops:
//
// 1. Something has to actually ask the browser to check for a new sw.js — browsers only do this
//    on their own schedule (up to once every 24h) otherwise. registration.update() forces the
//    check: once immediately, again on an interval, and again whenever the app becomes visible
//    (closing and reopening a backgrounded/killed PWA is exactly this app's real usage pattern,
//    and a plain timer alone is unreliable there — background tabs get throttled, and a fully
//    closed app has no timer running at all).
// 2. Once a new worker is found, this build sets registerType:'autoUpdate', which bakes
//    skipWaiting()+clientsClaim() into the generated service worker — so the new worker never
//    sits in the "waiting" state that virtual:pwa-register's onNeedRefresh callback is built
//    around; it installs and activates itself immediately. The signal that actually fires here
//    is the standard serviceWorker 'controllerchange' event once the new worker claims the
//    already-open page, so that (not onNeedRefresh) is what triggers the reload.
const UPDATE_CHECK_INTERVAL_MS = 60 * 1000

let refreshing = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshing) return
  refreshing = true
  window.location.reload()
})

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    registration.update()
    setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)
