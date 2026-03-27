export function formatOrderNumber(sequence: number) {
  return `PED-${String(sequence).padStart(6, "0")}`;
}
