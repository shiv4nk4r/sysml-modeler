import { memberOwner } from "../model/query";
import { EditResult, ModelSnapshot } from "../model/types";
import { insertMember } from "./insertMember";
import { requireName } from "./requireName";

export function addState(snapshot: ModelSnapshot, ownerId: string | undefined, name: string): EditResult {
  const parsed = requireName(name);
  if (!parsed.ok) {
    return parsed;
  }
  const owner = memberOwner(snapshot, ownerId) ?? snapshot.elements.find((element) => element.kind === "package");
  if (!owner) {
    return { ok: false, message: "Choose a package for the new state." };
  }
  return insertMember(snapshot, owner.id, `state ${parsed.name};`);
}
