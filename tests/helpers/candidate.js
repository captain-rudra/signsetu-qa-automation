import { randomUUID } from "node:crypto";

export function uniqueCandidateId(prefix = "qa") {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}
