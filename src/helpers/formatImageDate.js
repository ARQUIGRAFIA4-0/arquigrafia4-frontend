export function formatImageDate(dates) {
  if (!dates || dates.length === 0) return null;

  const dateInfo = dates.find((d) => d.type === "creation") || dates[0];
  if (!dateInfo) return null;

  const earliest = dateInfo.earliest_date ? new Date(dateInfo.earliest_date).getFullYear() : null;
  const latest = dateInfo.latest_date ? new Date(dateInfo.latest_date).getFullYear() : null;
  const circa = dateInfo.circa_earliest_date || dateInfo.circa_latest_date;

  if (!earliest) return null;

  const prefix = circa ? "c." : "";

  if (!latest || earliest === latest) {
    return `${prefix}${earliest}`;
  }

  return `${prefix}${earliest}-${latest}`;
}
