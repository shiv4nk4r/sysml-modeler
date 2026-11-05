import { themeTokens } from "../theme/tokens";

export function diagramDocument(nonce: string): string {
  const tokens = themeTokens;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Diagram</title>
  <style>
    :root {
      color-scheme: dark;
      --canvas: ${tokens.canvas};
      --stroke: ${tokens.nodeStroke};
      --label: ${tokens.label};
      --accent: ${tokens.accent};
      --muted: ${tokens.muted};
      --fill: ${tokens.nodeFill};
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; background: var(--canvas); color: var(--label); font-family: system-ui, sans-serif; }
    body { display: flex; flex-direction: column; }
    header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #2a3340; }
    h1 { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.01em; }
    .spacer { flex: 1; }
    button, select { background: var(--fill); color: var(--label); border: 1px solid #2a3340; border-radius: 4px; padding: 4px 8px; font: inherit; font-size: 12px; }
    button:hover, select:hover { border-color: var(--accent); }
    button:disabled, select:disabled { opacity: 0.45; }
    #palette { display: none; gap: 6px; }
    #palette.visible { display: flex; }
    #stage { flex: 1; overflow: hidden; position: relative; cursor: grab; }
    #stage.dragging { cursor: grabbing; }
    #viewport { transform-origin: 0 0; }
    .node.selected rect { stroke: var(--accent); stroke-width: 1.6; }
  </style>
</head>
<body>
  <header>
    <h1 id="title">Diagram</h1>
    <select id="kind" aria-label="Diagram kind">
      <option value="interconnection">Interconnection</option>
      <option value="general">General</option>
      <option value="state">State</option>
      <option value="actionFlow">Action flow</option>
    </select>
    <div id="palette">
      <button data-create="part" type="button">Part</button>
      <button data-create="port" type="button">Port</button>
      <button data-create="state" type="button">State</button>
      <button id="connect" type="button">Connect</button>
      <button id="transition" type="button">Transition</button>
    </div>
    <div class="spacer"></div>
    <button id="rename" type="button">Rename</button>
    <button id="manual" type="button">Manual layout</button>
    <button id="zoom-out" type="button">−</button>
    <button id="zoom-in" type="button">+</button>
    <button id="fit" type="button">Fit</button>
    <button data-export="svg" type="button">SVG</button>
    <button data-export="png" type="button">PNG</button>
    <button data-export="pdf" type="button">PDF</button>
  </header>
  <div id="stage"><div id="viewport"></div></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const stage = document.getElementById("stage");
    const viewport = document.getElementById("viewport");
    const title = document.getElementById("title");
    const kind = document.getElementById("kind");
    const palette = document.getElementById("palette");
    const manual = document.getElementById("manual");
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let experimental = false;
    let selected = new Set();
    let drag = null;
    const apply = () => { viewport.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + scale + ")"; };
    const post = (message) => vscode.postMessage(message);
    const paintSelection = () => {
      viewport.querySelectorAll(".node").forEach((node) => node.classList.toggle("selected", selected.has(node.getAttribute("data-id"))));
    };
    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type !== "render") return;
      title.textContent = message.title;
      kind.value = message.kind;
      kind.disabled = !message.implicit;
      experimental = message.experimental;
      palette.classList.toggle("visible", experimental);
      manual.textContent = message.manual ? "Automatic layout" : "Manual layout";
      viewport.innerHTML = message.svg;
      selected = new Set();
      paintSelection();
    });
    kind.addEventListener("change", () => post({ type: "kind", kind: kind.value }));
    manual.addEventListener("click", () => post({ type: "layout" }));
    document.getElementById("rename").addEventListener("click", () => post({ type: "rename" }));
    document.getElementById("connect").addEventListener("click", () => post({ type: "connect" }));
    document.getElementById("transition").addEventListener("click", () => post({ type: "transition" }));
    document.getElementById("zoom-in").addEventListener("click", () => { scale *= 1.15; apply(); });
    document.getElementById("zoom-out").addEventListener("click", () => { scale /= 1.15; apply(); });
    document.getElementById("fit").addEventListener("click", () => { scale = 1; panX = 0; panY = 0; apply(); });
    document.querySelectorAll("[data-export]").forEach((button) => button.addEventListener("click", () => post({ type: "export", format: button.getAttribute("data-export") })));
    document.querySelectorAll("[data-create]").forEach((button) => button.addEventListener("click", () => post({ type: "create", gesture: button.getAttribute("data-create") })));
    stage.addEventListener("pointerdown", (event) => {
      const node = event.target.closest(".node");
      if (experimental && node) {
        drag = { id: node.getAttribute("data-id"), qn: node.getAttribute("data-qn"), x: event.clientX, y: event.clientY, panX, panY };
        return;
      }
      drag = { pan: true, x: event.clientX, y: event.clientY, panX, panY };
      stage.classList.add("dragging");
    });
    stage.addEventListener("pointermove", (event) => {
      if (!drag) return;
      if (drag.pan) {
        panX = drag.panX + event.clientX - drag.x;
        panY = drag.panY + event.clientY - drag.y;
        apply();
      }
    });
    stage.addEventListener("pointerup", (event) => {
      if (drag && drag.qn) {
        const dx = (event.clientX - drag.x) / scale;
        const dy = (event.clientY - drag.y) / scale;
        const node = viewport.querySelector('[data-id="' + CSS.escape(drag.id) + '"] rect');
        const baseX = node ? Number(node.getAttribute("x")) - 24 : 0;
        const baseY = node ? Number(node.getAttribute("y")) - 48 : 0;
        post({ type: "move", qualifiedName: drag.qn, x: baseX + dx, y: baseY + dy });
      }
      drag = null;
      stage.classList.remove("dragging");
    });
    stage.addEventListener("click", (event) => {
      const node = event.target.closest(".node");
      if (!node) {
        selected.clear();
        paintSelection();
        return;
      }
      const id = node.getAttribute("data-id");
      if (event.shiftKey) {
        selected.has(id) ? selected.delete(id) : selected.add(id);
      } else {
        selected = new Set([id]);
        post({ type: "reveal", id });
      }
      paintSelection();
      post({ type: "select", ids: [...selected] });
    });
    stage.addEventListener("wheel", (event) => {
      event.preventDefault();
      scale *= event.deltaY < 0 ? 1.08 : 0.92;
      apply();
    }, { passive: false });
    post({ type: "ready" });
  </script>
</body>
</html>`;
}
