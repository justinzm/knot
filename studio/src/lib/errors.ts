export function normalizeUnknownError(caught: unknown): string {
  if (caught instanceof Error) {
    return caught.message;
  }
  if (typeof caught === "string") {
    return caught;
  }
  if (
    caught &&
    typeof caught === "object" &&
    "message" in caught &&
    typeof caught.message === "string"
  ) {
    return caught.message;
  }

  try {
    return JSON.stringify(caught) ?? String(caught);
  } catch {
    return String(caught);
  }
}
