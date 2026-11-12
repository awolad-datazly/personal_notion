export function assertResourceOwner(ownerId: string, actorId: string) {
  if (ownerId !== actorId) {
    throw new Error("Resource not found.");
  }
}
