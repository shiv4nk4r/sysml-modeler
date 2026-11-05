import { findElement, packageOwner } from "../model/query";
import { EditResult, ModelSnapshot } from "../model/types";
import { insertMember } from "./insertMember";

export function addTransition(snapshot: ModelSnapshot, ownerId: string | undefined, fromId: string, toId: string): EditResult {
  const owner = packageOwner(snapshot, ownerId);
  const from = fromId ? findElement(snapshot, fromId) : undefined;
  const to = toId ? findElement(snapshot, toId) : undefined;
  if (!owner || !from || !to) {
    return { ok: false, message: "Select two states for the transition." };
  }
  return insertMember(snapshot, owner.id, `transition ${from.name} then ${to.name};`);
}
