import { themeTokens } from "./tokens";

export function shellStyle(): string {
  const tokens = themeTokens;
  return `color-scheme: dark; background: ${tokens.canvas}; color: ${tokens.label}; font-family: system-ui, sans-serif; margin: 0; padding: 28px;
    h1 { font-size: 22px; font-weight: 600; margin: 0 0 8px; }
    p, li { color: ${tokens.nodeStroke}; line-height: 1.5; }
    button { background: ${tokens.nodeFill}; color: ${tokens.label}; border: 1px solid #2a3340; border-radius: 4px; padding: 8px 12px; margin-right: 8px; font: inherit; }
    button:hover { border-color: ${tokens.accent}; }
    code, pre { background: ${tokens.nodeFill}; border: 1px solid #2a3340; border-radius: 4px; }
    code { padding: 0 4px; }
    pre { padding: 12px; overflow: auto; }
    a { color: ${tokens.accent}; }`;
}
