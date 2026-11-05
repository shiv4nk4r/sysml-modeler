import { bindModel } from "../model/bindModel";
import { mergeParsed, parseDocument } from "./sysmlParser";
import { ModelSource, ModelSnapshot, TextDocumentInput } from "../model/types";

export class ParsingModelSource implements ModelSource {
  parseDocuments(documents: TextDocumentInput[]): ModelSnapshot {
    const parsed = documents.map((document) => parseDocument(document));
    return bindModel(mergeParsed(documents, parsed));
  }
}
