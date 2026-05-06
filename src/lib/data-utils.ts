export function toStringArray(value: unknown) {
  if (!value || !Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string");
}
