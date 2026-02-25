import axios from "@/axios";
import {
  createEmptyFeatureCollection,
} from "@/helpers/geojson";

const baseURL = () => axios.defaults.baseURL;

/**
 * Mapeia um item da API de listagem para o formato usado pela aplicação
 */
const mapImageListItem = (image) => ({
  id: image.id,
  title: image.titles?.[0]?.label || `Imagem ${image.legacy_id || image.id.substring(0, 8)}`,
  imageUrl: `${baseURL()}/${image.mid_url}`,
  thumbUrl: `${baseURL()}/${image.thumb_url}`,
  fullUrl: `${baseURL()}/${image.full_url}`,
  userId: image.user_id,
  createdAt: image.created_at,
  updatedAt: image.updated_at,
  subjects: image.subjects || [],
  dates: image.dates || [],
});

/**
 * Obtém os detalhes completos de uma imagem pelo ID
 */
const getImageDetails = async (id) => {
  try {
    const result = await axios.get(`/api/images/${id}`);
    const image = result.data.data;

    const preferredTitle = image.titles?.find((t) => t.pref === true);
    const title = preferredTitle?.label || image.titles?.[0]?.label || `Imagem ${image.legacy_id || image.id.substring(0, 8)}`;

    const uploader = image.user;
    const description = image.descriptions?.[0]?.text || null;

    const authors = Array.isArray(image.agents)
      ? image.agents
        .map((agent) => agent?.contributor_name?.name)
        .filter((name) => name != null && name !== "")
      : [];

    const dateInfo = image.dates?.find((d) => d.type === "creation") || image.dates?.[0];
    let date = null;

    if (dateInfo) {
      const earliestDate = dateInfo.earliest_date;
      const latestDate = dateInfo.latest_date;

      if (earliestDate && latestDate) {
        if (earliestDate === latestDate) {
          const d = new Date(earliestDate);
          date = d.toLocaleDateString('pt-BR', {
            timeZone: 'UTC',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        } else {
          const earliestYear = new Date(earliestDate).getUTCFullYear();
          const latestYear = new Date(latestDate).getUTCFullYear();

          if (earliestYear === latestYear) {
            date = earliestYear.toString();
          } else {
            date = `${earliestYear}-${latestYear}`;
          }
        }
      } else {
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

    if (!date && image.created_at) {
      const d = new Date(image.created_at);
      date = d.toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    const location = image.locations?.[0];
    const lat = parseFloat(location?.latitude);
    const lng = parseFloat(location?.longitude);
    const hasValidCoordinates = location && lat !== 0 && lng !== 0;

    const locationCoordinates = hasValidCoordinates ? [lat, lng] : null;
    const locationLabel = hasValidCoordinates ? (location.label || null) : null;

    const subjects = image.subjects || [];
    const rights = image.rights || [];

    return {
      id: image.id,
      title,
      imageUrl: `${baseURL()}/${image.mid_url}`,
      thumbUrl: `${baseURL()}/${image.thumb_url}`,
      fullUrl: `${baseURL()}/${image.full_url}`,
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

// TODO: implementar endpoint real de comentários
const getImageComments = async () => {
  return [];
};

const getGeoJSON = async () => {
  try {
    const { data } = await axios.get("/api/locations/geojson");

    const features = (data.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        imageUrl: feature.properties?.thumb_url ?? null,
        title: feature.properties?.title ?? null,
      },
    }));

    const featureCollection = { type: "FeatureCollection", features };

    return {
      obra: createEmptyFeatureCollection(),
      imagem: featureCollection,
    };
  } catch (error) {
    console.error("Erro ao carregar GeoJSON de localizações", error);
    return {
      obra: createEmptyFeatureCollection(),
      imagem: createEmptyFeatureCollection(),
    };
  }
};

/**
 * Busca imagens na API com filtros
 */
const searchImages = async ({ mode, value, page = 1 } = {}) => {
  const params = { page };

  if (mode === "textual") {
    const q = typeof value === "string" ? value.trim() : "";
    if (q) {
      params.q = q;
    }
  } else if (mode === "data") {
    if (value?.start) params.date_from = value.start;
    if (value?.end) params.date_to = value.end;
  } else if (mode === "avancada") {
    const filters = value || {};
    const terms = Array.isArray(filters.terms) ? filters.terms : [];
    const tags = Array.isArray(filters.tags) ? filters.tags : [];
    const subjects = Array.isArray(filters.subjects) ? filters.subjects : [];

    for (const term of terms) {
      if (!term?.value) continue;
      switch (term.field) {
        case "all":
          params.q = term.value;
          break;
        case "author":
          params.contributor = term.value;
          break;
        case "tag":
          params.subject_term = term.value;
          break;
        case "title":
          params.title = term.value;
          break;
      }
    }

    for (const tag of tags) {
      if (tag) params.subject_term = tag;
    }

    if (subjects.length > 0) {
      params["subject[]"] = subjects.length === 1 ? subjects[0] : subjects;
    }
  }

  // Only page param means no actual search filters were added
  if (Object.keys(params).length <= 1) {
    return { items: [], hasMore: false };
  }

  try {
    const { data } = await axios.get("/api/images", { params });
    const items = data.data.map(mapImageListItem);

    return {
      items,
      hasMore: Boolean(data.links?.next),
    };
  } catch (error) {
    console.error("Error searching images:", error);
    return { items: [], hasMore: false };
  }
};

/**
 * Busca imagens paginadas da API
 */
const fetchImages = async (page = 1, filters = {}) => {
  try {
    const params = { page };
    if (filters.userId) params.user_id = filters.userId;
    const { data } = await axios.get("/api/images", { params });

    const items = data.data.map(mapImageListItem);

    return {
      items,
      hasMore: Boolean(data.links.next),
    };
  } catch (error) {
    console.error("Error fetching images:", error);
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

export const api = {
  getImages: fetchImages,
  getGeoJSON,
  getImageDetails,
  getImageComments,
  searchImages,
  getTotalImages,
  getSubjectById,
};
