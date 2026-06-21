export function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toFixed(digits).replace(/\.0$/, "");
}

export function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${Math.round(value * 1000) / 10}%`;
}

export function splitLabel(value) {
  return value === "playoffs" ? "Playoffs" : "Regular season";
}
