import { ModelDiagnostic, ModelElement, ModelSnapshot, TextDocumentInput } from "../model/types";
import { Token, tokenize } from "./tokenize";

const SKIP_WORDS = new Set(["doc", "comment", "alias", "metadata", "enum", "rep"]);

export function parseDocument(input: TextDocumentInput): { elements: ModelElement[]; diagnostics: ModelDiagnostic[] } {
  return new DocumentParser(input).parse();
}

class DocumentParser {
  private readonly tokens: Token[];
  private index = 0;
  private readonly elements: ModelElement[] = [];
  private readonly diagnostics: ModelDiagnostic[] = [];
  private readonly stack: ModelElement[] = [];

  constructor(private readonly input: TextDocumentInput) {
    this.tokens = tokenize(input.text);
  }

  parse(): { elements: ModelElement[]; diagnostics: ModelDiagnostic[] } {
    this.parseBody();
    return { elements: this.elements, diagnostics: this.diagnostics };
  }

  private parseBody(): void {
    while (!this.checkPunct("}") && !this.isEof()) {
      const before = this.index;
      this.parseStatement();
      if (this.index === before) {
        this.index += 1;
      }
    }
  }

  private parseStatement(): void {
    const token = this.peek();
    if (token.kind !== "id") {
      this.diagnose(token, `Unsupported syntax '${token.text || "end of file"}'.`);
      this.skipRest();
      return;
    }
    if (token.text === "private" || token.text === "public" || token.text === "import") {
      this.skipRest();
      return;
    }
    if (SKIP_WORDS.has(token.text)) {
      this.consume();
      this.skipRest();
      return;
    }
    switch (token.text) {
      case "package":
        this.parsePackage();
        return;
      case "part":
        this.parsePartLike("part");
        return;
      case "interface":
        this.parsePartLike("interface");
        return;
      case "port":
        this.parseNamed("port");
        return;
      case "action":
        this.parseDefOrUsage("action");
        return;
      case "state":
        this.parseDefOrUsage("state");
        return;
      case "view":
        this.parseDefOrUsage("view");
        return;
      case "connect":
        this.parseLink("connection");
        return;
      case "succession":
        this.parseFlow("succession");
        return;
      case "transition":
        this.parseFlow("transition");
        return;
      case "expose":
        this.parseExpose();
        return;
      case "render":
        this.parseRender();
        return;
      case "filter":
        this.parseFilter();
        return;
      case "attribute":
        this.parseAttribute();
        return;
      default:
        this.diagnose(token, `Unsupported construct '${token.text}'.`);
        this.consume();
        this.skipRest();
    }
  }

  private parsePackage(): void {
    const start = this.consume();
    const name = this.expectId();
    this.expectPunct("{");
    const element = this.addElement("package", name, start.start);
    this.stack.push(element);
    this.parseBody();
    this.closeBrace(element);
    this.stack.pop();
  }

  private parsePartLike(keyword: "part" | "interface"): void {
    const start = this.consume();
    const isDef = this.consumeWord("def");
    const name = this.expectId();
    const typeName = this.consumeType();
    const kind = keyword === "interface" ? "interface" : isDef ? "partDef" : "part";
    const element = this.addElement(kind, name, start.start, { typeName });
    this.finishBody(element);
  }

  private parseDefOrUsage(keyword: "action" | "state" | "view"): void {
    const start = this.consume();
    const isDef = this.consumeWord("def");
    const name = this.expectId();
    const viewType = keyword === "view" ? this.consumeType() : undefined;
    const typeName = keyword === "view" ? undefined : this.consumeType();
    const kind = isDef ? (`${keyword}Def` as "actionDef" | "stateDef" | "viewDef") : keyword;
    const element = this.addElement(kind, name, start.start, { typeName, viewType });
    this.finishBody(element);
  }

  private parseNamed(kind: "port"): void {
    const start = this.consume();
    if (this.peek().text === "def") {
      this.consume();
    }
    const name = this.expectId();
    const element = this.addElement(kind, name, start.start);
    this.finishBody(element);
  }

  private parseLink(kind: "connection"): void {
    const start = this.consume();
    const from = this.readDotted();
    this.expectWord("to");
    const to = this.readDotted();
    const end = this.expectPunct(";");
    const nameToken = { text: `${from} to ${to}`, start: start.start, end: end.end, kind: "id" as const };
    this.addElement(kind, nameToken, start.start, { from, to }, "semi", end.end);
  }

  private parseFlow(kind: "succession" | "transition"): void {
    const start = this.consume();
    const from = this.expectId();
    this.expectWord("then");
    const to = this.expectId();
    const end = this.expectPunct(";");
    const nameToken = { text: `${from.text} then ${to.text}`, start: from.start, end: to.end, kind: "id" as const };
    this.addElement(kind, nameToken, start.start, { from: from.text, to: to.text }, "semi", end.end);
  }

  private parseExpose(): void {
    this.consume();
    const path = this.readExposePath();
    this.expectPunct(";");
    const view = this.currentView();
    if (!view) {
      return;
    }
    view.meta = { ...view.meta, expose: [...(view.meta?.expose ?? []), path] };
  }

  private parseRender(): void {
    this.consume();
    const render = this.readQualified();
    this.expectPunct(";");
    const view = this.currentView();
    if (view) {
      view.meta = { ...view.meta, render };
    }
  }

  private parseFilter(): void {
    this.consume();
    if (this.checkPunct("@")) {
      this.consume();
    }
    const filter = this.readQualified();
    this.expectPunct(";");
    const view = this.currentView();
    if (view) {
      view.meta = { ...view.meta, filter };
    }
  }

  private parseAttribute(): void {
    this.consume();
    const name = this.expectId();
    if (this.checkPunct("=")) {
      this.consume();
    }
    const valueToken = this.peek();
    const value = valueToken.kind === "string" || valueToken.kind === "number" || valueToken.kind === "id" ? valueToken.text : "";
    if (value) {
      this.consume();
    }
    this.expectPunct(";");
    const view = this.currentView();
    if (!view) {
      return;
    }
    if (name.text === "fileName") {
      view.meta = { ...view.meta, fileName: value };
    } else if (name.text === "fileType") {
      view.meta = { ...view.meta, fileType: value };
    } else if (name.text === "depth") {
      const depth = Number(value);
      if (!Number.isNaN(depth)) {
        view.meta = { ...view.meta, depth };
      }
    }
  }

  private finishBody(element: ModelElement): void {
    if (this.checkPunct("{")) {
      this.consume();
      this.stack.push(element);
      this.parseBody();
      this.closeBrace(element);
      this.stack.pop();
      return;
    }
    const end = this.expectPunct(";");
    element.terminator = "semi";
    element.insertOffset = end.start;
    element.range = { ...element.range, end: end.end };
  }

  private closeBrace(element: ModelElement): void {
    const end = this.expectPunct("}");
    element.terminator = "brace";
    element.insertOffset = end.start;
    element.range = { ...element.range, end: end.end };
  }

  private addElement(
    kind: ModelElement["kind"],
    name: Token,
    start: number,
    meta?: ModelElement["meta"],
    terminator?: "brace" | "semi",
    endOverride?: number,
  ): ModelElement {
    const parent = this.stack[this.stack.length - 1];
    const element: ModelElement = {
      id: `${this.input.uri}#${start}`,
      kind,
      name: name.text,
      qualifiedName: parent ? `${parent.qualifiedName}::${name.text}` : name.text,
      parentId: parent?.id,
      range: { uri: this.input.uri, start, end: endOverride ?? name.end },
      nameRange: { uri: this.input.uri, start: name.start, end: name.end },
      terminator,
      meta,
    };
    this.elements.push(element);
    return element;
  }

  private currentView(): ModelElement | undefined {
    for (let index = this.stack.length - 1; index >= 0; index -= 1) {
      if (this.stack[index].kind === "view") {
        return this.stack[index];
      }
    }
    return undefined;
  }

  private consumeType(): string | undefined {
    if (!this.checkPunct(":")) {
      return undefined;
    }
    this.consume();
    return this.readQualified();
  }

  private readQualified(): string {
    const first = this.expectId();
    let name = first.text;
    while (this.checkPunct("::") && this.tokens[this.index + 1]?.kind === "id") {
      this.consume();
      name += `::${this.expectId().text}`;
    }
    return name;
  }

  private readDotted(): string {
    let name = this.expectId().text;
    while (this.checkPunct(".") && this.tokens[this.index + 1]?.kind === "id") {
      this.consume();
      name += `.${this.expectId().text}`;
    }
    return name;
  }

  private readExposePath(): string {
    if (this.checkPunct("*") || this.checkPunct("**")) {
      return this.consume().text;
    }
    let path = this.readQualified();
    if (this.checkPunct("::") && (this.tokens[this.index + 1]?.text === "*" || this.tokens[this.index + 1]?.text === "**")) {
      this.consume();
      path += `::${this.consume().text}`;
    }
    return path;
  }

  private skipRest(): void {
    let depth = 0;
    let seenBrace = false;
    while (!this.isEof()) {
      if (this.checkPunct("{")) {
        seenBrace = true;
        depth += 1;
        this.consume();
        continue;
      }
      if (this.checkPunct("}")) {
        if (depth === 0) {
          return;
        }
        depth -= 1;
        this.consume();
        if (depth === 0 && seenBrace) {
          return;
        }
        continue;
      }
      if (this.checkPunct(";") && depth === 0) {
        this.consume();
        return;
      }
      this.consume();
    }
  }

  private consumeWord(word: string): boolean {
    if (this.peek().kind === "id" && this.peek().text === word) {
      this.consume();
      return true;
    }
    return false;
  }

  private expectWord(word: string): Token {
    const token = this.peek();
    if (token.kind === "id" && token.text === word) {
      return this.consume();
    }
    this.diagnose(token, `Expected '${word}'.`);
    return token;
  }

  private expectId(): Token {
    const token = this.peek();
    if (token.kind === "id") {
      return this.consume();
    }
    this.diagnose(token, "Expected a name.");
    return { kind: "id", text: "unnamed", start: token.start, end: token.end };
  }

  private expectPunct(text: string): Token {
    const token = this.peek();
    if (token.kind === "punct" && token.text === text) {
      return this.consume();
    }
    this.diagnose(token, `Expected '${text}'.`);
    return token;
  }

  private diagnose(token: Token, message: string): void {
    this.diagnostics.push({
      uri: this.input.uri,
      start: token.start,
      end: token.end,
      message,
      severity: "error",
    });
  }

  private checkPunct(text: string): boolean {
    const token = this.peek();
    return token.kind === "punct" && token.text === text;
  }

  private isEof(): boolean {
    return this.peek().kind === "eof";
  }

  private peek(): Token {
    return this.tokens[Math.min(this.index, this.tokens.length - 1)];
  }

  private consume(): Token {
    const token = this.peek();
    if (token.kind !== "eof") {
      this.index += 1;
    }
    return token;
  }
}

export function mergeParsed(
  documents: TextDocumentInput[],
  parsed: { elements: ModelElement[]; diagnostics: ModelDiagnostic[] }[],
): ModelSnapshot {
  return {
    documents: documents.map((document) => ({ uri: document.uri, text: document.text })),
    elements: parsed.flatMap((item) => item.elements),
    relationships: [],
    diagnostics: parsed.flatMap((item) => item.diagnostics),
  };
}
