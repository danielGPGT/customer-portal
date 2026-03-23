'use client'

/**
 * Replaces console methods with no-ops in production so third-party and
 * framework dev logs do not appear in the browser DevTools console.
 * Runs at module load on the client (earlier than useEffect).
 */
const MARKER = '__customerPortalConsoleSilenced'

function installProductionConsoleSilencer() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    return
  }

  const w = window as Window & Record<string, unknown>
  if (w[MARKER]) {
    return
  }
  w[MARKER] = true

  const noop = () => {}
  const methods = [
    'log',
    'debug',
    'info',
    'warn',
    'error',
    'trace',
    'dir',
    'dirxml',
    'group',
    'groupCollapsed',
    'groupEnd',
    'table',
    'time',
    'timeEnd',
    'timeLog',
    'assert',
    'clear',
    'count',
    'countReset',
    'profile',
    'profileEnd',
  ] as const

  for (const key of methods) {
    try {
      if (typeof (console as Record<string, unknown>)[key] === 'function') {
        ;(console as Record<string, unknown>)[key] = noop
      }
    } catch {
      // ignore
    }
  }
}

installProductionConsoleSilencer()

export function ConsoleSilencer() {
  return null
}
