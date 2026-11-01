export const duration = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((s / 60) % 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
};
export const length = (m: number, units: "km" | "mi") =>
  (m / (units === "mi" ? 1609.344 : 1000)).toFixed(2);
export const pace = (secondsPerKm: number | null, units: "km" | "mi") => {
  if (!secondsPerKm || !Number.isFinite(secondsPerKm)) return "—";
  const s = Math.round(secondsPerKm * (units === "mi" ? 1.609344 : 1));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
