import { findElement, packageOwner } from "../model/query";
import { EditResult, ModelSnapshot } from "../model/types";
import { insertMember } from "./insertMember";

export function endpointPath(snapshot: ModelSnapshot, elementId: string, packageId: string): string | undefined {
  const names: string[] = [];
  let current = findElement(snapshot, elementId);
  while (current && current.id !== packageId) {
    names.unshift(current.name);
    const parentId = current.parentId;
    current = parentId ? findElement(snapshot, parentId) : undefined;
  }
  if (!current || names.length === 0) {
    return undefined;
  }
  return names.join(".");
}

export function addConnection(snapshot: ModelSnapshot, ownerId: string | undefined, fromId: string, toId: string): EditResult {
  const owner = packageOwner(snapshot, ownerId);
  if (!owner) {
    return { ok: false, message: "Select a package for the connection." };
  }
  const from = endpointPath(snapshot, fromId, owner.id);
  const to = endpointPath(snapshot, toId, owner.id);
  if (!from || !to) {
    return { ok: false, message: "Select two ports in the same package." };
  }
  return insertMember(snapshot, owner.id, `connect ${from} to ${to};`);
}
