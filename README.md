# SysML Diagram Modeler

A standalone IDE built on Code-OSS. The SysML modeler ships as a built-in extension. Branding, feature switches, and workbench trims live in `ide/`.

## Standalone IDE (shipped product)

Use **Node 24.22.1** (matches Code-OSS `1.145.0`). Plan for several GB of disk and a few GB of RAM for the first install.

```bash
cd /Users/shivankarsharma/newcastle_ms/sysml-diagram-modeler

# 1. Clone Code-OSS, merge branding, install the modeler as a built-in
npm run ide:bootstrap

# 2. Install Code-OSS dependencies (once, slow)
npm run ide:install

# 3. Terminal A — compile and watch the workbench
npm run ide:watch

# 4. Terminal B — launch the branded app with examples/vehicle
npm run ide:run
```

You should get an app named **SysML Diagram Modeler**, not VS Code. Open `vehicle.sysml`; the diagram opens beside the text. Model / Diagram / Guide are the main rail.

### Package an installable build

After `ide:bootstrap` and `ide:install`:

```bash
npm run ide:package
```

That runs the Code-OSS gulp target for your OS (`vscode-darwin-arm64`, `vscode-darwin-x64`, `vscode-win32-x64`, or `vscode-linux-x64`). The output lands under `ide/vendor/vscode/.build/` / the usual VS Code package folders.

## Extension-only loop (faster for diagram work)

```bash
npm install --prefix extensions/sysml-modeler
npm run compile
```

In Cursor/VS Code, press **F5** (**Run SysML Diagram Modeler**). That loads only the extension against stock VS Code.

## Checks

```bash
npm test
npm run check:product
```

## Layout

- `extensions/sysml-modeler/` — parser, diagrams, export, write-back, theme, rail views
- `ide/product.overlay.json` — product name, Open VSX, defaults (`sysml.productMode`)
- `ide/features.json` — what the shell turns off
- `ide/scripts/bootstrap.mjs` — clone + brand + copy built-in extension
- `examples/` — sample SysML models and README
