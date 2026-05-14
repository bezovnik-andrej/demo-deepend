import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import App from './App'
import { UILibrary } from './UILibrary'
import { Portal } from './Portal'
import { BackOffice } from './components/BackOffice/BackOffice'
import { Login } from './components/Login/Login'
import { readDemoAuthed } from './demoAuth'

/**
 * Normalize the document URL once before React mounts.
 * Must not run inside useState (Strict Mode double-invokes initializers in dev).
 */
function bootstrapClientUrl(): void {
  let path = window.location.pathname.replace(/\/$/, '') || '/'

  if (
    path !== '/' &&
    (path.startsWith('/projects') || path.startsWith('/companies'))
  ) {
    const inner = path.slice(1)
    window.history.replaceState(null, '', `${window.location.origin}${path}#/backoffice/${inner}`)
  }

  path = window.location.pathname.replace(/\/$/, '') || '/'
  if (path === '/login') {
    window.history.replaceState(null, '', '/#/login')
  } else if (path === '/app' || path.startsWith('/app/')) {
    const inner = path === '/app' ? '' : path.slice('/app'.length).replace(/^\//, '')
    const tail = inner.replace(/\/$/, '')
    const hashPath = tail ? `app/${tail}` : 'app'
    window.history.replaceState(null, '', `/#/${hashPath}`)
  }

  if (!import.meta.env.PROD) return

  path = window.location.pathname.replace(/\/$/, '') || '/'
  const hash = window.location.hash
  if (path === '/' && (hash === '' || hash === '#')) {
    window.history.replaceState(null, '', readDemoAuthed() ? '/#/app' : '/#/login')
  }
}

function readRouteHash(): string {
  const h = window.location.hash
  if (h && h !== '#') return h
  return '#/'
}

function isProtectedRoute(route: string): boolean {
  return route.startsWith('#/app') || route.startsWith('#/backoffice')
}

function isAuthed(): boolean {
  return readDemoAuthed()
}

export function Root() {
  const [route, setRoute] = useState(readRouteHash)

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (isProtectedRoute(route) && !isAuthed()) {
      window.location.hash = '#/login'
    }
  }, [route])

  if (route === '#/login') {
    return <Login />;
  }

  if (isProtectedRoute(route) && !isAuthed()) {
    return <Login />;
  }

  if (route === '#/ui-library') {
    return <UILibrary />;
  }

  if (route.startsWith('#/backoffice')) {
    return <BackOffice />;
  }

  if (route.startsWith('#/app')) {
    const [pathPart, queryPart] = route.split('?');
    const parts = pathPart.split('/');
    const workspace = parts[2] || undefined;
    const initialProjectId = queryPart
      ? new URLSearchParams(queryPart).get('project') ?? undefined
      : undefined;
    /* `key` forces a remount when crossing the landing/workspace boundary so
       state can't leak from a previous in-app navigation. */
    return <App key={`${workspace || 'landing'}:${initialProjectId ?? ''}`} initialWorkspace={workspace} initialProjectId={initialProjectId} />;
  }

  return <Portal />;
}

bootstrapClientUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
