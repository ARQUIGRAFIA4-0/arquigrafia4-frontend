// Mock API service for images
import randomBetween from "@/helpers/randomBetween";
import delay from "@/helpers/delay";
import normalizeLimit from "@/helpers/normalizeLimit";
import {
  createEmptyFeatureCollection,
  createFeatureCollectionsByType,
} from "@/helpers/geojson";

/**
 * Gera coordenadas aleatórias dentro da região de São Paulo
 * @returns {[number, number]} Array com [latitude, longitude] dentro dos limites de SP
 */
const randomSaoPauloLatLang = () => {
  const latMin = -23.7;
  const latMax = -23.45;
  const lngMin = -46.75;
  const lngMax = -46.45;

  const lat = randomBetween(latMin, latMax);
  const lng = randomBetween(lngMin, lngMax);

  return [lat, lng];
};

/** @constant {number} DEFAULT_PAGE_LIMIT - Limite padrão de itens por página */
const DEFAULT_PAGE_LIMIT = 12;

/**
 * Gera itens mock simulando uma resposta paginada da API
 * @param {number} page - Número da página atual
 * @param {number|Object} limitOrOptions - Limite de itens ou objeto de opções
 * @param {number} [limitOrOptions.limit] - Limite de itens por página
 * @param {number} [limitOrOptions.initialLimit] - Limite especial para a primeira página
 * @returns {Promise<{items: Array<Object>, hasMore: boolean}>} Objeto com itens e indicador de mais páginas
 */
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

/**
 * Obtém os detalhes completos de uma imagem pelo ID
 * @param {number|string} id - ID da imagem
 * @returns {Promise<Object>} Objeto com detalhes da imagem incluindo título, URL, autor, localização, descrição e tags
 */
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

/**
 * Obtém os comentários de uma imagem específica
 * @param {number|string} imageId - ID da imagem
 * @returns {Promise<Array<Object>>} Array de comentários com id, autor, avatar, conteúdo e data
 */
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

/**
 * Obtém as identidades de publicação disponíveis para o usuário
 * @returns {Promise<Array<Object>>} Array de identidades com id, nome, avatar e tipo (user ou organization)
 */
const getPublishingIdentities = async () => {
  await delay(300);
  return [
    {
      id: 1,
      name: "Lero Lero",
      avatar: null,
      initials: "LL",
      type: "organization",
    },
    {
      id: 2,
      name: "Lina Bo Bardi",
      avatar: "https://i.pravatar.cc/40?u=maria",
      type: "user",
    },
  ];
};

/**
 * Busca todos os itens mock de todas as páginas disponíveis
 * @param {Object} options - Opções de paginação
 * @param {number} [options.limit] - Limite de itens por página
 * @param {number} [options.initialLimit] - Limite especial para a primeira página
 * @returns {Promise<Array<Object>>} Array com todos os itens de todas as páginas
 */
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

/**
 * Obtém dados GeoJSON de todas as imagens separados por tipo
 * @param {Object} options - Opções de paginação para busca dos itens
 * @param {number} [options.limit] - Limite de itens por página
 * @param {number} [options.initialLimit] - Limite especial para a primeira página
 * @returns {Promise<{obra: Object, imagem: Object}>} Objeto com FeatureCollections de obras e imagens
 */
const getGeoJSON = async (options = {}) => {
  const items = await fetchAllMockItems(options);
  const collections = createFeatureCollectionsByType(items);

  return {
    obra: collections.obra ?? createEmptyFeatureCollection(),
    imagem: collections.imagem ?? createEmptyFeatureCollection(),
  };
};

/**
 * Simula uma busca de imagens
 * Por enquanto retorna sempre vazio para testar o componente NoSearchResults
 * @param {Object} params - Parâmetros de busca
 * @param {string} params.mode - Modo de busca (textual, data, cor, avancada)
 * @param {any} params.value - Valor da busca
 * @returns {Promise<{items: Array, total: number}>}
 */
const searchImages = async (params) => {
  await delay(500);

  // Simula busca sem resultados
  return {
    items: [],
    total: 0,
  };
};

/**
 * Objeto de API com métodos para interação com o backend (mock)
 * @namespace api
 * @property {Function} getImages - Obtém imagens paginadas
 * @property {Function} getGeoJSON - Obtém dados GeoJSON das imagens
 * @property {Function} getImageDetails - Obtém detalhes de uma imagem
 * @property {Function} getImageComments - Obtém comentários de uma imagem
 * @property {Function} getPublishingIdentities - Obtém identidades de publicação
 * @property {Function} searchImages - Busca imagens por parâmetros
 */
export const api = {
  getImages: generateMockItems,
  getGeoJSON,
  getImageDetails,
  getImageComments,
  getPublishingIdentities,
  searchImages,
};
