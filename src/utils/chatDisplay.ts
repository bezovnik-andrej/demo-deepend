/** Strip `**bold**` wrappers used in chat strings; bubbles render plain text only. */
export function stripSimpleMarkdown(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1');
}
