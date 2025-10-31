// Mock API service for images
const randomBetween = (min, max) => Math.random() * (max - min) + min;

const randomSaoPauloLatLang = () => {
  const latMin = -23.7;
  const latMax = -23.45;
  const lngMin = -46.75;
  const lngMax = -46.45;

  const lat = randomBetween(latMin, latMax);
  const lng = randomBetween(lngMin, lngMax);

  return [lat, lng];
};

const DEFAULT_PAGE_LIMIT = 12;

const normalizeLimit = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const generateMockItems = (page, limitOrOptions = DEFAULT_PAGE_LIMIT) => {
  const options =
    typeof limitOrOptions === "number"
      ? { limit: limitOrOptions }
      : limitOrOptions ?? {};

  const limit = normalizeLimit(options.limit, DEFAULT_PAGE_LIMIT);
  const initialLimit =
    options.initialLimit !== undefined
      ? normalizeLimit(options.initialLimit, limit)
      : undefined;

  const itemsPerPage =
    page === 1 && typeof initialLimit === "number" ? initialLimit : limit;

  const items = [];
  const baseUrl = "https://www.arquigrafia.org.br/arquigrafia-images";

  for (let i = 0; i < itemsPerPage; i++) {
    const id = Math.floor(Math.random() * 15000) + 1;
    items.push({
      id,
      title: `Imagem ${id}`,
      imageUrl: `${baseUrl}/${id}_view.jpg`,
      type: Math.random() < 0.5 ? "obra" : "imagem",
      latlang: randomSaoPauloLatLang(),
    });
  }

  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        items,
        hasMore: page < 5, // Simulate a limit of 5 pages for demo
      });
    }, 5);
  });
};
         
const createEmptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

const normalizeCoordinates = (latlng) => {
  if (!Array.isArray(latlng) || latlng.length < 2) {
    return null;
  }

  const [lat, lng] = latlng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return [lng, lat];
};

const createFeatureCollectionsByType = (items = []) => {
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
};

const fetchAllMockItems = async (options = {}) => {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await generateMockItems(page, options);
    if (!response || !Array.isArray(response.items)) {
      break;
    }

    allItems.push(...response.items);
    hasMore = Boolean(response.hasMore);
    page += 1;
  }

  return allItems;
};

const getGeoJSON = async (options = {}) => {
  const items = await fetchAllMockItems(options);
  const collections = createFeatureCollectionsByType(items);

  return {
    obra: collections.obra ?? createEmptyFeatureCollection(),
    imagem: collections.imagem ?? createEmptyFeatureCollection(),
  };
};

export const api = {
  getImages: generateMockItems,
  getGeoJSON,
};
