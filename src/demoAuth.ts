const AUTH_KEY = 'norveo-auth';

/** Demo login: production uses sessionStorage so each new tab/session hits login; dev keeps localStorage for convenience. */
export function readDemoAuthed(): boolean {
  try {
    if (import.meta.env.PROD) {
      return sessionStorage.getItem(AUTH_KEY) === '1';
    }
    return localStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDemoAuthed(): void {
  try {
    if (import.meta.env.PROD) {
      sessionStorage.setItem(AUTH_KEY, '1');
    } else {
      localStorage.setItem(AUTH_KEY, '1');
    }
  } catch {
    /* ignore */
  }
}
