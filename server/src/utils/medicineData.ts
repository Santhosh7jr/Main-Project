export const uniqueMedicineLabels = (values: unknown[]): string[] => {
  const seen = new Set<string>();

  return values
    .map((value) => String(value ?? "").replace(/\s+/g, " ").trim())
    .filter((value) => {
      const key = value.toLowerCase();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
};
