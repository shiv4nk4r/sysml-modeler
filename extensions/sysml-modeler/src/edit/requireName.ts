const KEYWORDS = new Set([
  "package",
  "part",
  "port",
  "connect",
  "action",
  "succession",
  "state",
  "transition",
  "view",
  "interface",
  "def",
  "expose",
  "render",
  "filter",
]);

export function requireName(value: string): { ok: true; name: string } | { ok: false; message: string } {
  const name = value.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return { ok: false, message: "Names use letters, digits, and underscores, and start with a letter or underscore." };
  }
  if (KEYWORDS.has(name)) {
    return { ok: false, message: `'${name}' is a reserved word.` };
  }
  return { ok: true, name };
}
