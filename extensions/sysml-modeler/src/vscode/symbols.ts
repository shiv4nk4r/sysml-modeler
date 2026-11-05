import * as vscode from "vscode";
import { positionAt } from "../model/textPosition";
import { ElementKind, ModelElement } from "../model/types";
import { ParsingModelSource } from "../parse/parsingModelSource";

const KINDS: Partial<Record<ElementKind, vscode.SymbolKind>> = {
  package: vscode.SymbolKind.Package,
  part: vscode.SymbolKind.Class,
  partDef: vscode.SymbolKind.Interface,
  port: vscode.SymbolKind.Property,
  action: vscode.SymbolKind.Method,
  state: vscode.SymbolKind.EnumMember,
  view: vscode.SymbolKind.Struct,
  connection: vscode.SymbolKind.Event,
};

export function registerSymbols(context: vscode.ExtensionContext, source: ParsingModelSource): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider("sysml", {
      provideDocumentSymbols(document) {
        const snapshot = source.parseDocuments([{ uri: document.uri.toString(), text: document.getText() }]);
        const text = document.getText();
        const visible = snapshot.elements.filter((element) => element.range.uri === document.uri.toString() && !element.meta?.inherited);
        const symbols = new Map(visible.map((element) => [element.id, toSymbol(element, text)]));
        const roots: vscode.DocumentSymbol[] = [];
        for (const element of visible) {
          const symbol = symbols.get(element.id);
          const parent = element.parentId ? symbols.get(element.parentId) : undefined;
          if (!symbol) {
            continue;
          }
          if (parent) {
            parent.children.push(symbol);
          } else {
            roots.push(symbol);
          }
        }
        return roots;
      },
    }),
  );
}

function toSymbol(element: ModelElement, text: string): vscode.DocumentSymbol {
  const start = positionAt(text, element.range.start);
  const end = positionAt(text, element.range.end);
  const nameStart = positionAt(text, element.nameRange.start);
  const nameEnd = positionAt(text, element.nameRange.end);
  const range = new vscode.Range(start.line, start.character, end.line, end.character);
  const selection = new vscode.Range(nameStart.line, nameStart.character, nameEnd.line, nameEnd.character);
  return new vscode.DocumentSymbol(element.name, element.kind, KINDS[element.kind] ?? vscode.SymbolKind.Object, range, selection);
}
