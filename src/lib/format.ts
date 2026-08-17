export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  if (hours === 0) return "0 h";
  if (hours < 1) return "< 1 h";
  return `${hours.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
