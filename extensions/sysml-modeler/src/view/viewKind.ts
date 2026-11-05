export type ViewKind = "interconnection" | "general" | "state" | "actionFlow";

export interface ResolvedView {
  kind: ViewKind;
  title: string;
  implicit: boolean;
  rootId?: string;
  elementIds: string[];
  fileName?: string;
  fileType?: string;
}

export interface ViewCursor {
  uri: string;
  offset: number;
}
