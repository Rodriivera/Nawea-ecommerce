export function money(value: number): string {
  return "$" + value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
