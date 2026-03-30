function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function supportsMultipleFillings(productName: string) {
  const normalized = normalizeValue(productName);
  return (
    normalized.includes("ovo de colher") ||
    normalized.includes("ovo trufado") ||
    normalized.includes("ovo de pascoa recheado")
  );
}
