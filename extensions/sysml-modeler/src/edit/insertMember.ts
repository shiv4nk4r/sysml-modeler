import { findElement } from "../model/query";
import { EditResult, ModelSnapshot } from "../model/types";

export function insertMember(snapshot: ModelSnapshot, ownerId: string, line: string): EditResult {
  const owner = findElement(snapshot, ownerId);
  if (!owner || owner.insertOffset === undefined || !owner.terminator) {
    return { ok: false, message: "Choose a package or part that can contain new elements." };
  }
  if (owner.terminator === "brace") {
    return {
      ok: true,
      change: { uri: owner.range.uri, start: owner.insertOffset, end: owner.insertOffset, text: `\n  ${line}\n` },
    };
  }
  return {
    ok: true,
    change: {
      uri: owner.range.uri,
      start: owner.insertOffset,
      end: owner.insertOffset + 1,
      text: ` {\n  ${line}\n}`,
    },
  };
}
