const SENSITIVE = /secret|password|token|jwt|authorization|cookie|card|cvv|pan/i;

export function logEvent(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
) {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SENSITIVE.test(key)) continue;
    if (value === undefined) continue;
    safe[key] = value;
  }
  console.info(JSON.stringify({ event, ...safe, at: new Date().toISOString() }));
}
