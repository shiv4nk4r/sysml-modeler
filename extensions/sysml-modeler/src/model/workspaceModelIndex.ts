import { isModelPath } from "../files/filePolicy";
import { ModelSnapshot, ModelSource, TextDocumentInput } from "./types";

export class WorkspaceModelIndex {
  constructor(private readonly source: ModelSource) {}

  fromDocuments(documents: TextDocumentInput[]): ModelSnapshot {
    return this.source.parseDocuments(documents.filter((document) => isModelPath(document.uri)));
  }
}
