export function isEnglishEnabled(): boolean {
  const val = import.meta.env.ENABLE_EN ?? process.env.ENABLE_EN;
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const lower = val.trim().toLowerCase();
    return (
      lower === "true" || lower === "1" || lower === "yes" || lower === "on"
    );
  }
  return false;
}
