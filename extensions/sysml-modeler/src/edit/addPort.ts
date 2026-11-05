import { memberOwner } from "../model/query";
import { EditResult, ModelSnapshot } from "../model/types";
import { insertMember } from "./insertMember";
import { requireName } from "./requireName";

export function addPort(snapshot: ModelSnapshot, ownerId: string | undefined, name: string): EditResult {
  const parsed = requireName(name);
  if (!parsed.ok) {
    return parsed;
  }
  const owner = memberOwner(snapshot, ownerId);
  if (!owner || (owner.kind !== "part" && owner.kind !== "partDef" && owner.kind !== "interface")) {
    return { ok: false, message: "Select a part before adding a port." };
  }
  return insertMember(snapshot, owner.id, `port ${parsed.name};`);
}
