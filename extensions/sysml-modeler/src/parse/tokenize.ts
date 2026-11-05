export type TokenKind = "id" | "string" | "number" | "punct" | "eof";

export interface Token {
  kind: TokenKind;
  text: string;
  start: number;
  end: number;
}

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];
    if (char === " " || char === "\t" || char === "\r" || char === "\n") {
      index += 1;
      continue;
    }
    if (char === "/" && text[index + 1] === "/") {
      index += 2;
      while (index < text.length && text[index] !== "\n") {
        index += 1;
      }
      continue;
    }
    if (char === "/" && text[index + 1] === "*") {
      index += 2;
      while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) {
        index += 1;
      }
      index = Math.min(text.length, index + 2);
      continue;
    }
    if (char === "'") {
      const start = index;
      index += 1;
      let value = "";
      while (index < text.length && text[index] !== "'") {
        value += text[index];
        index += 1;
      }
      index = Math.min(text.length, index + 1);
      tokens.push({ kind: "id", text: value, start, end: index });
      continue;
    }
    if (char === '"') {
      const start = index;
      index += 1;
      let value = "";
      while (index < text.length && text[index] !== '"') {
        value += text[index];
        index += 1;
      }
      index = Math.min(text.length, index + 1);
      tokens.push({ kind: "string", text: value, start, end: index });
      continue;
    }
    if (char === "-" && /[0-9]/.test(text[index + 1] ?? "")) {
      const start = index;
      index += 1;
      while (index < text.length && /[0-9]/.test(text[index])) {
        index += 1;
      }
      tokens.push({ kind: "number", text: text.slice(start, index), start, end: index });
      continue;
    }
    if (/[0-9]/.test(char)) {
      const start = index;
      while (index < text.length && /[0-9]/.test(text[index])) {
        index += 1;
      }
      tokens.push({ kind: "number", text: text.slice(start, index), start, end: index });
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const start = index;
      index += 1;
      while (index < text.length && /[A-Za-z0-9_]/.test(text[index])) {
        index += 1;
      }
      tokens.push({ kind: "id", text: text.slice(start, index), start, end: index });
      continue;
    }
    if (char === ":" && text[index + 1] === ":") {
      tokens.push({ kind: "punct", text: "::", start: index, end: index + 2 });
      index += 2;
      continue;
    }
    if (char === "*" && text[index + 1] === "*") {
      tokens.push({ kind: "punct", text: "**", start: index, end: index + 2 });
      index += 2;
      continue;
    }
    tokens.push({ kind: "punct", text: char, start: index, end: index + 1 });
    index += 1;
  }

  tokens.push({ kind: "eof", text: "", start: text.length, end: text.length });
  return tokens;
}
