// Mock API service for images
const randomBetween = (min, max) => Math.random() * (max - min) + min;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const getImageDetails = async (id) => {
  await delay(500);
  return {
    id,
    title: "Praça Pinheiro da Cunha",
    imageUrl: `https://www.arquigrafia.org.br/arquigrafia-images/${id}_view.jpg`,
    uploader: {
      name: "Roberto Sakamoto",
      avatar: "https://i.pravatar.cc/40?u=maria",
    },
    author: "SAKAMOTO, Roberto",
    date: "2003-06-24",
    location: "São Paulo, Brasil",
    locationCoordinates: [-23.569395, -46.651422],
    description:
      "A Praça Pinheiro da Cunha é um espaço verde linear inserido em área residencial, com vegetação arbórea diversificada e caminhos curvos que favorecem a circulação e o convívio.",
    tags: [
      "Frução urbana",
      "Modernismo",
      "Visualização de dados urbanos",
      "Imaginário urbano",
      "Percursos urbanos",
    ],
  };
};

const getImageComments = async (imageId) => {
  await delay(300);
  return [
    {
      id: 1,
      author: "Maria Silva",
      avatarUrl: "https://i.pravatar.cc/40?u=maria",
      content:
        "Excelente registro da arquitetura modernista brasileira! A composição destaca muito bem os elementos geométricos.",
      date: "2025-06-01T14:30:00Z",
      imageId,
    },
    {
      id: 2,
      author: "João Silva",
      avatarUrl: "https://i.pravatar.cc/40?u=roberto",
      content:
        "Espaço muito agradável e bem cuidado. A vegetação deixa o ambiente mais fresco e acolhedor. Seria ótimo ter mais bancos ou equipamentos para aproveitar melhor a praça!",
      date: "2025-06-01T14:30:00Z",
      imageId,
    },
  ];
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
  getImageDetails,
  getImageComments,
};
