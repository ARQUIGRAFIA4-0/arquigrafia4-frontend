export function orderPathStops(stops = []) {
  return [...stops]
    .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0))
    .map((stop, index) => ({
      key: `${stop?.order ?? index}-${index}`,
      number: index + 1,
      title: stop?.title?.trim() || `Ponto ${index + 1}`,
      imageId: stop?.imageId != null ? String(stop.imageId) : null,
      coordinates: Array.isArray(stop?.coordinates)
        ? [Number(stop.coordinates[0]), Number(stop.coordinates[1])]
        : null,
    }));
}
