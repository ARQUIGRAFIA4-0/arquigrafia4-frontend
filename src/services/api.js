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
  const apiBaseUrl = "https://api-dev.arquigrafia.org.br";
  const apiUrl = `${apiBaseUrl}/api/images/${id}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image details: ${response.statusText}`);
    }

    const result = await response.json();
    const image = result.data;

    // Extrai o título preferencial ou o primeiro disponível
    const preferredTitle = image.titles?.find((t) => t.pref === true);
    const title = preferredTitle?.label || image.titles?.[0]?.label || `Imagem ${image.legacy_id || image.id.substring(0, 8)}`;

    // Extrai o usuário que fez o envio
    const uploader = image.user;

    // Extrai a descrição
    const description = image.descriptions?.[0]?.text || null;

    // Extrai os autores de todos os agentes
    const authors = Array.isArray(image.agents)
      ? image.agents
        .map((agent) => agent?.contributor_name?.name)
        .filter((name) => name != null && name !== "")
      : [];

    // Extrai a data de criação
    const dateInfo = image.dates?.find((d) => d.type === "creation") || image.dates?.[0];
    let date = null;

    if (dateInfo) {
      const earliestDate = dateInfo.earliest_date;
      const latestDate = dateInfo.latest_date;

      // Verifica se ambas as datas existem
      if (earliestDate && latestDate) {
        // Verifica se as datas são exatamente iguais
        if (earliestDate === latestDate) {
          // Usa a data completa formatada
          const d = new Date(earliestDate);
          date = d.toLocaleDateString('pt-BR', {
            timeZone: 'UTC',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        } else {
          // Se forem diferentes, extrai os anos
          const earliestYear = new Date(earliestDate).getUTCFullYear();
          const latestYear = new Date(latestDate).getUTCFullYear();

          if (earliestYear === latestYear) {
            // Mesmo ano, retorna apenas o ano
            date = earliestYear.toString();
          } else {
            // Anos diferentes, retorna o range
            date = `${earliestYear}-${latestYear}`;
          }
        }
      } else {
        // Se uma das datas não existir, usa a que existir
        const singleDate = earliestDate || latestDate;
        if (singleDate) {
          const d = new Date(singleDate);
          date = d.toLocaleDateString('pt-BR', {
            timeZone: 'UTC',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        }
      }
    }

    // Se não houver data de criação, usa created_at como fallback
    if (!date && image.created_at) {
      const d = new Date(image.created_at);
      date = d.toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    // Extrai a localização
    const location = image.locations?.[0];
    const lat = parseFloat(location?.latitude);
    const lng = parseFloat(location?.longitude);

    // Verifica se as coordenadas são válidas
    // Não considera os casos de latitude ou longitude iguais a "0.00000000"
    const hasValidCoordinates = location && lat !== 0 && lng !== 0;

    const locationCoordinates = hasValidCoordinates ? [lat, lng] : null;
    const locationLabel = hasValidCoordinates ? (location.label || null) : null;

    // Subjects/Tags
    const subjects = image.subjects || [];

    // Extrai os direitos/licença
    const rights = image.rights || [];

    return {
      id: image.id,
      title,
      imageUrl: `${apiBaseUrl}/${image.mid_url}`,
      thumbUrl: `${apiBaseUrl}/${image.thumb_url}`,
      fullUrl: `${apiBaseUrl}/${image.full_url}`,
      uploader,
      authors,
      date,
      location: locationLabel,
      locationCoordinates,
      description,
      subjects,
      rights,
    };
  } catch (error) {
    console.error("Error fetching image details:", error);
    throw error;
  }
};

/**
 * Obtém os comentários de uma imagem específica
 * @param {number|string} imageId - ID da imagem
 * @returns {Promise<Array<Object>>} Array de comentários com id, autor, avatar, conteúdo e data
 */
const getImageComments = async (imageId) => {
  await delay(300);
  return [];
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
const searchImages = async () => {
  await delay(500);

  // Simula busca sem resultados
  return {
    items: [],
    total: 0,
  };
};

/**
 * Busca imagens da API
 * @param {number} page - Número da página atual
 * @param {number|Object} limitOrOptions - Limite de itens ou objeto de opções
 * @param {number} [limitOrOptions.limit] - Limite de itens por página
 * @param {number} [limitOrOptions.initialLimit] - Limite especial para a primeira página
 * @param {Object} [filters] - Filtros de busca (subjects, userId, etc.)
 * @param {Array<string>} [filters.subjects] - IDs dos subjects para filtrar
 * @param {string} [filters.userId] - ID do usuário para filtrar imagens
 * @returns {Promise<{items: Array<Object>, hasMore: boolean}>} Objeto com itens e indicador de mais páginas
 */
const fetchImages = async (page = 1, limitOrOptions = DEFAULT_PAGE_LIMIT, filters = {}) => {
  // const options =
  //   typeof limitOrOptions === "number"
  //     ? { limit: limitOrOptions }
  //     : limitOrOptions ?? {};

  // const limit = normalizeLimit(options.limit, DEFAULT_PAGE_LIMIT);
  // const perPage = limit;

  const apiBaseUrl = "https://api-dev.arquigrafia.org.br";
  
  // Constrói a query string com os filtros
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  
  // Adiciona filtro de subjects (IDs específicos) se presente
  if (filters.subjects && Array.isArray(filters.subjects)) {
    filters.subjects.forEach(subjectId => {
      if (subjectId) {
        queryParams.append('subject[]', subjectId);
      }
    });
  }
  
  // Adiciona filtro de subject_term (busca parcial por termo) se presente
  if (filters.subjectTerm && typeof filters.subjectTerm === 'string') {
    queryParams.append('subject_term', filters.subjectTerm);
  }
  
  // Adiciona filtro de usuário se presente
  if (filters.userId) {
    queryParams.append('user_id', filters.userId);
  }
  
  const apiUrl = `${apiBaseUrl}/api/images?${queryParams.toString()}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`);
    }

    const data = await response.json();

    const items = data.data.map((image) => ({
      id: image.id,
      title: image.titles?.[0]?.label || `Imagem ${image.legacy_id || image.id.substring(0, 8)}`,
      imageUrl: `${apiBaseUrl}/${image.mid_url}`,
      thumbUrl: `${apiBaseUrl}/${image.thumb_url}`,
      fullUrl: `${apiBaseUrl}/${image.full_url}`,
      userId: image.user_id,
      createdAt: image.created_at,
      updatedAt: image.updated_at,
      type: Math.random() < 0.5 ? "obra" : "imagem",
      latlang: randomSaoPauloLatLang(),
      subjects: image.subjects || [],
      dates: image.dates || [],
    }));

    return {
      items,
      hasMore: Boolean(data.links.next),
    };
  } catch (error) {
    console.error("Error fetching real images:", error);
    return {
      items: [],
      hasMore: false,
    };
  }
};

/**
 * Busca o total de imagens cadastradas no sistema
 * Faz uma chamada mínima à API (per_page=1) para obter apenas o total
 * @returns {Promise<number>} Total de imagens cadastradas
 */
const getTotalImages = async () => {
  const apiBaseUrl = "https://api-dev.arquigrafia.org.br";
  const apiUrl = `${apiBaseUrl}/api/images?per_page=1`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch images total: ${response.statusText}`);
    }

    const data = await response.json();
    return data.meta?.total || 0;
  } catch (error) {
    console.error("Error fetching images total:", error);
    return 0;
  }
};

/**
 * Busca um subject específico por ID
 * @param {string} id - UUID do subject
 * @returns {Promise<{id: string, term: string}|null>} Objeto com id e term, ou null em caso de erro
 */
const getSubjectById = async (id) => {
  if (!id || typeof id !== 'string') {
    console.error('getSubjectById: ID inválido', id);
    return null;
  }

  const apiBaseUrl = "https://api-dev.arquigrafia.org.br";
  const apiUrl = `${apiBaseUrl}/api/vrac-subjects/${id}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch subject: ${response.statusText}`);
    }

    const responseData = await response.json();
    const term = responseData.data?.term;

    if (!term) {
      console.warn(`Subject ${id} sem termo válido`);
      return null;
    }

    return { id, term };
  } catch (error) {
    console.error(`Error fetching subject ${id}:`, error);
    return null;
  }
};

/**
 * Objeto de API com métodos para interação com o backend
 * @namespace api
 * @property {Function} getImages - Obtém imagens paginadas da API
 * @property {Function} getImagesMock - Obtém imagens paginadas mockadas
 * @property {Function} getGeoJSON - Obtém dados GeoJSON das imagens
 * @property {Function} getImageDetails - Obtém detalhes de uma imagem
 * @property {Function} getImageComments - Obtém comentários de uma imagem
 * @property {Function} getPublishingIdentities - Obtém identidades de publicação
 * @property {Function} searchImages - Busca imagens por parâmetros
 * @property {Function} getTotalImages - Obtém o total de imagens cadastradas
 * @property {Function} getSubjectById - Obtém subject por ID
 */
export const api = {
  getImages: fetchImages, // Agora usa a API real
  getImagesMock: generateMockItems, // Mantém a versão mock para referência
  getGeoJSON,
  getImageDetails,
  getImageComments,
  getPublishingIdentities,
  searchImages,
  getTotalImages,
  getSubjectById,
};
