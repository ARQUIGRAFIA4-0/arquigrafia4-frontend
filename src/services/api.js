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

// TODO: implementar endpoint real de GeoJSON
const getGeoJSON = async () => {
  return {
    obra: createEmptyFeatureCollection(),
    imagem: createEmptyFeatureCollection(),
  };
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
const fetchImages = async (page = 1) => {
  try {
    const { data } = await axios.get("/api/images", {
      params: { page },
    });

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

export const api = {
  getImages: fetchImages,
  getGeoJSON,
  getImageDetails,
  getImageComments,
  searchImages,
};
