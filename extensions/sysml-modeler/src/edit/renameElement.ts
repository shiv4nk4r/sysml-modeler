import { findElement } from "../model/query";
import { EditResult, ModelSnapshot } from "../model/types";
import { requireName } from "./requireName";

export function renameElement(snapshot: ModelSnapshot, elementId: string, nextName: string): EditResult {
  const parsed = requireName(nextName);
  if (!parsed.ok) {
    return parsed;
  }
  const element = findElement(snapshot, elementId);
  if (!element) {
    return { ok: false, message: "That element is not in the model." };
  }
  if (element.meta?.inherited) {
    return { ok: false, message: "Rename an inherited port on its definition." };
  }
  return {
    ok: true,
    change: {
      uri: element.nameRange.uri,
      start: element.nameRange.start,
      end: element.nameRange.end,
      text: parsed.name,
    },
  };
}
