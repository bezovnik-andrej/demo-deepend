const MAX_LEN = 254;

/** Practical check for configurator completion (not full RFC 5322). */
export function isReasonableEmail(value: string): boolean {
  const s = value.trim();
  if (s.length < 5 || s.length > MAX_LEN) return false;
  const at = s.indexOf('@');
  if (at <= 0 || at !== s.lastIndexOf('@')) return false;
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (!local || !domain || local.includes(' ') || domain.includes(' ')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;
  if (!domain.includes('.')) return false;
  return true;
}
