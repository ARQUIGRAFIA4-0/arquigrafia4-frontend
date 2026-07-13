/**
 * Cria uma FeatureCollection GeoJSON vazia
 * @returns {{type: string, features: Array}} FeatureCollection vazia no formato GeoJSON
 */
export function createEmptyFeatureCollection() {
  return {
    type: "FeatureCollection",
    features: [],
  };
}

/**
 * Normaliza coordenadas de [lat, lng] para o formato GeoJSON [lng, lat]
 * @param {Array<number>} latlng - Array com [latitude, longitude]
 * @returns {[number, number]|null} Array com [longitude, latitude] ou null se inválido
 */
export function normalizeCoordinates(latlng) {
  if (!Array.isArray(latlng) || latlng.length < 2) {
    return null;
  }

  const [lat, lng] = latlng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lng, lat];
}

/**
 * Cria FeatureCollections GeoJSON separadas por tipo (obra/imagem)
 * @param {Array<Object>} items - Array de itens com latlang, title, id, imageUrl e type
 * @returns {{obra: Object, imagem: Object}} Objeto com duas FeatureCollections separadas por tipo
 */
export function createFeatureCollectionsByType(items = []) {
  const buckets = {
    obra: [],
    imagem: [],
  };

  items.forEach((item) => {
    const coordinates = normalizeCoordinates(item?.latlang);
    if (!coordinates) return;

    const title = item?.title ?? `Imagem ${item?.id ?? ""}`;

    const feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates,
      },
      properties: {
        id: item?.id ?? null,
        title,
        imageUrl: item?.imageUrl ?? null,
        type: item?.type ?? null,
      },
    };

    const bucketKey = item?.type === "obra" ? "obra" : "imagem";
    buckets[bucketKey].push(feature);
  });

  return {
    obra: {
      type: "FeatureCollection",
      features: buckets.obra,
    },
    imagem: {
      type: "FeatureCollection",
      features: buckets.imagem,
    },
  };
}


/**
 * Converte imagens da coleção em FeatureCollection GeoJSON.
 * Usa locationCoordinates no formato [lat, lng] da API.
 */
export function createCollectionImagesFeatureCollection(images = []) {
  const features = [];

  images.forEach((image) => {
    const coordinates = normalizeCoordinates(image?.locationCoordinates);
    if (!coordinates) return;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates,
      },
      properties: {
        id: image?.id ?? null,
        title: image?.title ?? "",
        thumbUrl: image?.thumbUrl ?? image?.imageUrl ?? null,
        imageUrl: image?.imageUrl ?? null,
      },
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Resolve thumb_url absoluta ou relativa (iiif/...).
 */
export function resolveMediaUrl(path, baseUrl = "") {
  if (typeof path !== "string") return null;

  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = typeof baseUrl === "string" ? baseUrl.replace(/\/$/, "") : "";
  const normalizedPath = trimmed.replace(/^\//, "");
  return base ? `${base}/${normalizedPath}` : normalizedPath;
  
}

/**
 * Converte FeatureCollection da API de localizações
 * para o formato usado pelo LocationsMap (locationCoordinates em [lat, lng]).
 */
export function mapLocationsGeoJsonToImages(featureCollection, baseUrl = "") {
  const features = Array.isArray(featureCollection?.features)
    ? featureCollection.features
    : [];

  return features
    .map((feature) => {
      const coords = feature?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return null;

      const [lng, lat] = coords;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

      const props = feature.properties ?? {};

      return {
        id: props.image_id ?? null,
        title: props.title ?? "",
        thumbUrl: resolveMediaUrl(props.thumb_url, baseUrl),
        imageUrl: resolveMediaUrl(props.thumb_url, baseUrl),
        locationCoordinates: [lat, lng],
      };
    })
    .filter((image) => image?.id && image.locationCoordinates);

}