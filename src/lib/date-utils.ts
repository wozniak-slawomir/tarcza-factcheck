export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "teraz";
  if (diffSec < 60) return `${diffSec} sekund temu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minut${diffMin === 1 ? "ę" : ""} temu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} godzin${diffHour === 1 ? "ę" : ""} temu`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays <= 7) return `${diffDays} dni temu`;

  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}