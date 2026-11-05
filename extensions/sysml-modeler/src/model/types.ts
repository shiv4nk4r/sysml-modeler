export interface SourceRange {
  uri: string;
  start: number;
  end: number;
}

export type ElementKind =
  | "package"
  | "partDef"
  | "part"
  | "port"
  | "connection"
  | "actionDef"
  | "action"
  | "succession"
  | "stateDef"
  | "state"
  | "transition"
  | "viewDef"
  | "view"
  | "interface";

export interface ElementMeta {
  typeName?: string;
  from?: string;
  to?: string;
  expose?: string[];
  render?: string;
  filter?: string;
  fileName?: string;
  fileType?: string;
  viewType?: string;
  depth?: number;
  inherited?: boolean;
}

export interface ModelElement {
  id: string;
  kind: ElementKind;
  name: string;
  qualifiedName: string;
  parentId?: string;
  range: SourceRange;
  nameRange: SourceRange;
  insertOffset?: number;
  terminator?: "brace" | "semi";
  meta?: ElementMeta;
}

export type RelationshipKind = "connection" | "succession" | "transition";

export interface Relationship {
  id: string;
  kind: RelationshipKind;
  sourceId: string;
  targetId: string;
  label?: string;
  range: SourceRange;
  elementId: string;
}

export interface ModelDiagnostic {
  uri: string;
  start: number;
  end: number;
  message: string;
  severity: "error" | "warning";
}

export interface ModelDocument {
  uri: string;
  text: string;
}

export interface ModelSnapshot {
  documents: ModelDocument[];
  elements: ModelElement[];
  relationships: Relationship[];
  diagnostics: ModelDiagnostic[];
}

export interface TextDocumentInput {
  uri: string;
  text: string;
}

export interface ModelSource {
  parseDocuments(documents: TextDocumentInput[]): ModelSnapshot;
}

export interface TextChange {
  uri: string;
  start: number;
  end: number;
  text: string;
}

export type EditResult =
  | { ok: true; change: TextChange }
  | { ok: false; message: string };
