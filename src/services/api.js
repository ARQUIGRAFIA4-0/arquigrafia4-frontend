import axios from "@/axios";
import {
  createEmptyFeatureCollection,
} from "@/helpers/geojson";
import { filtersToApiParams } from "@/helpers/searchQueryMapping";

const baseURL = () => axios.defaults.baseURL;

const isoYear = (value) => {
  const year = typeof value === "string" ? value.slice(0, 4) : "";
  return /^\d{4}$/.test(year) ? year : null;
};

/**
 * Retorna o título preferencial de uma obra (VRACWork), com fallback para o
 * primeiro título disponível.
 */
const workPrimaryTitle = (work) => {
  const titles = work?.titles || [];
  const preferred = titles.find((t) => t.pref);
  return (preferred || titles[0])?.label || "Obra sem título";
};

/**
 * Mapeia um item da API de listagem para o formato usado pela aplicação
 */
export const mapImageListItem = (image) => ({
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
 * GeoJSON com localizações de todas as imagens do acervo.
 */
const getLocationsGeoJSON = async () => {
  const response = await axios.get("/api/locations/geojson");
  return response.data;
};

/**
 * Retorna um GeoJSON do acervo filtrado aceita os mesmos parâmetros do GET /api/images,
 * exceto por paginação (page, per_page) e ordenação (sort). Permite filtrar apenas marcadores de obras com works_only.
 */
const getFilteredLocationsGeoJSON = async (params = {}) => {
  const response = await axios.get("/api/locations/geojson/search", { params });
  return response.data;
};

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

    const collective = image.collective ?? null;

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

    // Obras associadas à imagem. O backend inclui `works` com `works.titles` e
    // `works.location` no GET /images/{id}. Uma imagem pode não ter obra (array vazio).
    const works = Array.isArray(image.works)
      ? image.works.map((work) => ({
          id: work.id,
          title: workPrimaryTitle(work),
          locationLabel: work.location?.label || null,
        }))
      : [];

    return {
      id: image.id,
      title,
      imageUrl: `${baseURL()}/${image.mid_url}`,
      thumbUrl: `${baseURL()}/${image.thumb_url}`,
      fullUrl: `${baseURL()}/${image.full_url}`,
      uploader,
      collective,
      authors,
      date,
      dateRaw: dateInfo ? {
        earliest_date: dateInfo.earliest_date,
        latest_date: dateInfo.latest_date,
        circa: dateInfo.circa_earliest_date ?? false,
      } : null,
      dates: image.dates || [],
      location: locationLabel,
      locationCoordinates,
      description,
      subjects,
      rights,
      works,
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

/**
 * Busca imagens relacionadas
 */
const getRelatedImages = async (imageId, page = 1) => {
  return axios
    .get(`api/images/${imageId}/related`, { params: { page } })
    .then((res) => res.data);
};

/**
 * Rótulo de um termo de vocabulário VRAC. Materiais, técnicas, períodos, contextos
 */
const vocabTerms = (list, key = "label") => (list || []).map((item) => ({ id: item.id, label: item[key] || null })).filter((item) => item.label);

/**
 * Normaliza uma VRACWork crua da API para o formato usado nas telas.
 *
 * Exportada porque o aceite de uma sugestão devolve a obra já atualizada — no
 * formato cru — e a tela precisa do mesmo shape que `getWorkDetails` entrega.
 */
const normalizeWork = (work) => {
  if (!work) return null;

  return {
    id: work.id,
    title: workPrimaryTitle(work),
    titles: work.titles || [],
    description: work.description ?? null,
    imagesCount: typeof work.images_count === "number" ? work.images_count : null,
    location: work.location
      ? {
          label: work.location.label || null,
          latitude: parseFloat(work.location.latitude),
          longitude: parseFloat(work.location.longitude),
        }
      : null,
    agents: (work.agents || []).map((agent) => ({
      id: agent.id,
      name: agent.contributor_name?.name || null,
      role: agent.role?.label || null,
      attribution: agent.attribution || null,
    })),
    dates: (work.dates || []).map((date) => ({
      id: date.id,
      type: date.type || null,
      earliestYear: isoYear(date.earliest_date),
      latestYear: isoYear(date.latest_date),
      circa: Boolean(date.circa_earliest_date || date.circa_latest_date),
    })),
    materials: vocabTerms(work.materials),
    techniques: vocabTerms(work.techniques),
    stylePeriods: vocabTerms(work.style_periods),
    culturalContexts: vocabTerms(work.cultural_contexts),
    workTypes: vocabTerms(work.work_types),
    subjects: vocabTerms(work.subjects, "term"),
  };
};

/**
 * Detalhe de uma obra (VRACWork) pelo ID — GET /api/vrac-works/{id}.
 */
const getWorkDetails = async (id) => {
  const response = await axios.get(`/api/vrac-works/${id}`);
  return normalizeWork(response.data.data);
};

/**
 * Autocomplete de um vocabulário VRAC via backend — GET /api/{endpoint}?search=.
 * Substitui o download do catálogo inteiro (per_page=-1) por busca sob demanda.
 * O backend filtra com LIKE cru (insensível a acento/caixa por colação), então
 * `%` e `_` são escapados para não virarem curingas. Devolve o array de itens
 * crus (cada um com `id` e o campo de texto do vocabulário: `label` ou `term`).
 */
const searchVocab = async (endpoint, query, { limit = 15 } = {}) => {
  const q = (query || "").trim();
  if (!q) return [];
  const search = q.replace(/[\\%_]/g, "\\$&");
  const response = await axios.get(`/api/${endpoint}`, {
    params: { search, per_page: limit },
  });
  return response.data?.data ?? [];
};

/**
 * Imagens associadas a uma obra — GET /api/images?work[]={id}.
 */
const getWorkImages = async (workId, { page = 1, perPage = 24 } = {}) => {
  const response = await axios.get("/api/images", {
    params: {
      "work[]": workId,
      sort_by: "created_at",
      sort_order: "asc",
      page,
      per_page: perPage,
    },
  });
  const items = (response.data.data || []).map(mapImageListItem);
  const meta = response.data.meta || null;
  const hasMore = response.data.links?.next
    ? true
    : meta?.current_page && meta?.last_page
      ? meta.current_page < meta.last_page
      : false;
  return { items, meta, hasMore };
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
  let params = { page };

  if (mode === "textual") {
    const q = typeof value === "string" ? value.trim() : "";
    if (q) {
      params.q = q;
    }
  } else if (mode === "data") {
    if (value?.start) params.date_from = value.start;
    if (value?.end) params.date_to = value.end;
  } else if (mode === "avancada") {
    params = filtersToApiParams(value, { page });
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

    // Filtro por busca textual geral (q)
    if (filters.q && typeof filters.q === 'string') {
      params.q = filters.q.trim();
    }

    // Filtro por intervalo de datas
    if (filters.date_from) {
      params.date_from = filters.date_from;
    }
    if (filters.date_to) {
      params.date_to = filters.date_to;
    }

    // Filtro por período da obra
    if (filters.workDateFrom) {
      params.work_date_from = filters.workDateFrom;
    }
    if (filters.workDateTo) {
      params.work_date_to = filters.workDateTo;
    }

    // Filtro por características (binômios da comunidade)
    if (filters.characteristics && typeof filters.characteristics === 'object') {
      Object.entries(filters.characteristics).forEach(([key, side]) => {
        if (side === 'left' || side === 'right') {
          params[`binomial[${key}]`] = side;
        }
      });
    }

    // Filtro por user_id
    if (filters.userId) {
      params.user_id = filters.userId;
    }

    // Filtro por collective_id
    if (filters.collectiveId) {
      params.collective_id = filters.collectiveId;
    }
    
    // Filtro por assuntos (tags de sujeito por ID)
    if (filters.subjects?.length) {
      params['subject[]'] = filters.subjects.length === 1 ? filters.subjects[0] : filters.subjects;
    }

    // Filtro por termos de assunto (partial match)
    if (filters.subjectTerms?.length) {
      params['subject_term[]'] = filters.subjectTerms.length === 1 ? filters.subjectTerms[0] : filters.subjectTerms;
    }

    // --- Novos campos ---
    if (filters.materialTerms?.length) {
      params['material_term[]'] = filters.materialTerms.length === 1 ? filters.materialTerms[0] : filters.materialTerms;
    }
    if (filters.techniqueTerms?.length) {
      params['technique_term[]'] = filters.techniqueTerms.length === 1 ? filters.techniqueTerms[0] : filters.techniqueTerms;
    }
    if (filters.aestheticsTerms?.length) {
      params['aesthetics_term[]'] = filters.aestheticsTerms.length === 1 ? filters.aestheticsTerms[0] : filters.aestheticsTerms;
    }
    if (filters.culturalContextTerms?.length) {
      params['cultural_context_term[]'] = filters.culturalContextTerms.length === 1 ? filters.culturalContextTerms[0] : filters.culturalContextTerms;
    }
    if (filters.typologyTerms?.length) {
      params['typology_term[]'] = filters.typologyTerms.length === 1 ? filters.typologyTerms[0] : filters.typologyTerms;
    }

    // Filtro por título (partial match)
    if (filters.title && typeof filters.title === 'string') {
      params.title = filters.title.trim();
    }

    // Filtro por contribuidor/autor (partial match)
    if (filters.contributor && typeof filters.contributor === 'string') {
      params.contributor = filters.contributor.trim();
    }

    // Filtro por licença CC (OR semântico: uma imagem só pode ter uma licença)
    if (filters.licenses?.length) {
      params['license[]'] = filters.licenses.length === 1 ? filters.licenses[0] : filters.licenses;
    }

    // Ordenação
    if (filters.sortBy) {
      params.sort_by = filters.sortBy;
    }
    if (filters.sortOrder) {
      params.sort_order = filters.sortOrder;
    }
    
    const { data } = await axios.get("/api/images", { params });

    const rawItems = filters.excludeCollectives
      ? data.data.filter((image) => image.collective_id === null)
      : data.data;

    const items = rawItems.map(mapImageListItem);

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
 * Faz uma chamada mínima à API (per_page=-1) para obter apenas o total
 * @returns {Promise<number>} Total de imagens cadastradas
 */
const getTotalImages = async () => {
  const apiBaseUrl = "https://api.arquigrafia.org.br";
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

  const apiBaseUrl = "https://api.arquigrafia.org.br";
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
 * Fábrica de funções getById/getAll para os vocabulários VRAC que só têm
 * rótulo simples ({id, label}) — materiais, técnicas, períodos de estilo,
 * contextos culturais, tipos de obra. Todos batem em endpoints
 * `->only(['index', 'show'])`, então só GET é necessário.
 */
const makeVocabApi = (resourcePath, labelField = 'label') => ({
  getById: async (id) => {
    if (!id || typeof id !== 'string') {
      console.error(`${resourcePath}: ID inválido`, id);
      return null;
    }
    try {
      const response = await axios.get(`/api/${resourcePath}/${id}`);
      const item = response.data?.data;
      const label = item?.[labelField];
      if (!label) {
        console.warn(`${resourcePath} ${id} sem ${labelField} válido`);
        return null;
      }
      return { id, [labelField]: label };
    } catch (error) {
      console.error(`Error fetching ${resourcePath} ${id}:`, error);
      return null;
    }
  },
  getAll: async () => {
    try {
      const response = await axios.get(`/api/${resourcePath}`, {
        headers: { "Content-Type": "application/json" },
        params: { per_page: -1 },
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching all ${resourcePath}:`, error);
      return [];
    }
  },
});

const materialsApi = makeVocabApi('vrac-materials');
const techniquesApi = makeVocabApi('vrac-techniques');
const stylePeriodsApi = makeVocabApi('vrac-style-periods');
const culturalContextsApi = makeVocabApi('vrac-cultural-contexts');
const workTypesApi = makeVocabApi('vrac-work-types');

const getMaterialById = materialsApi.getById;
const getAllMaterials = materialsApi.getAll;
const getTechniqueById = techniquesApi.getById;
const getAllTechniques = techniquesApi.getAll;
const getStylePeriodById = stylePeriodsApi.getById;
const getAllStylePeriods = stylePeriodsApi.getAll;
const getCulturalContextById = culturalContextsApi.getById;
const getAllCulturalContexts = culturalContextsApi.getAll;
const getWorkTypeById = workTypesApi.getById;
const getAllWorkTypes = workTypesApi.getAll;

/**
 * Deleta uma imagem pelo ID
 * @param {string} authHeader - Header de autorização (Bearer token)
 * @param {string} imageId - UUID da imagem a ser deletada
 * @returns {Promise<boolean>} True se deletado com sucesso
 */
const deleteImage = async (authHeader, imageId) => {
  try {
    await axios.delete(`/api/images/${imageId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
    });
    return true;
  } catch (error) {
    throw Error("Não foi possível excluir a imagem.");
  }
};

/**
 * Cria um novo coletivo
 * @param {string} authHeader - Header de autorização (Bearer token)
 * @param {FormData} formData - Dados do coletivo (name, description)
 * @returns {Promise<object>} Dados do coletivo criado
 */
const createCollective = async (authHeader, formData) => {
  try {
    const response = await axios.post("/api/collectives", formData, {
      headers: {
        "Authorization": authHeader,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.name?.[0] ||
      "Não foi possível criar o coletivo.";
    throw new Error(message);
  }
};

/**
 * Busca os dados de um coletivo pelo ID (sem autenticação)
 * @param {string} id - UUID do coletivo
 * @returns {Promise<object>} Dados do coletivo
 */
const getCollective = async (id) => {
  try {
    const response = await axios.get(`/api/collectives/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data.data;
  } catch (error) {
    throw new Error("Não foi possível carregar os dados do coletivo.");
  }
};

/**
 * Envia uma solicitação de entrada no coletivo
 * @param {string} authHeader - Header de autorização (Bearer token)
 * @param {string} id - UUID do coletivo
 * @returns {Promise<void>}
 */
const requestJoinCollective = async (authHeader, id) => {
  try {
    await axios.post(`/api/collectives/${id}/join-requests`, null, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
    });
  } catch (error) {
    const status = error.response?.status;
    let message;
    if (status === 422) {
      message = error.response?.data?.message || "Não foi possível realizar esta ação.";
    } else {
      message = "Não foi possível enviar a solicitação.";
    }
    const err = new Error(message);
    err.status = status;
    throw err;
  }
};

/**
 * Remove o próprio usuário do coletivo
 * @param {string} authHeader - Header de autorização (Bearer token)
 * @param {string} collectiveId - UUID do coletivo
 * @param {string} userId - UUID do usuário
 * @returns {Promise<void>}
 */
const leaveCollective = async (authHeader, collectiveId, userId) => {
  try {
    await axios.delete(`/api/collectives/${collectiveId}/members/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
    });
  } catch (error) {
    const status = error.response?.status;
    let message;
    if (status === 422) {
      message = error.response?.data?.message || "Não foi possível realizar esta ação.";
    } else if (status === 403) {
      message = "Você não tem permissão para realizar esta ação.";
    } else {
      message = "Não foi possível sair do coletivo. Tente novamente.";
    }
    const err = new Error(message);
    err.status = status;
    throw err;
  }
};

/**
 * Busca todos os subjects disponíveis
 * @returns {Promise<Array<{id: string, term: string}>>}
 */
const getAllSubjects = async () => {
  try {
    const response = await axios.get("/api/vrac-subjects", {
      headers: { "Content-Type": "application/json" },
      params: { per_page: -1 },
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching all subjects:", error);
    return [];
  }
};

/**
 * Atualiza os dados de um coletivo
 * @param {string} authHeader - Header de autorização (Bearer token)
 * @param {string} id - UUID do coletivo
 * @param {FormData} formData - Dados do formulário
 * @returns {Promise<object>} Dados atualizados do coletivo
 */
const updateCollective = async (authHeader, id, formData) => {
  // Laravel não suporta multipart/form-data em PATCH/PUT via PHP.
  // Usamos POST com _method=PATCH (method spoofing do Laravel).
  formData.append("_method", "PATCH");
  try {
    const response = await axios.post(`/api/collectives/${id}`, formData, {
      headers: {
        "Authorization": authHeader,
      },
    });
    return response.data.data;
  } catch (error) {
    const errors = error.response?.data?.errors;
    const message = errors
      ? Object.values(errors)[0]?.[0]
      : (error.response?.data?.message || "Não foi possível atualizar o coletivo.");
    throw new Error(message);
  }
};

/**
 * Remove um membro do coletivo (ação de admin)
 * @param {string} authHeader
 * @param {string} collectiveId
 * @param {string} userId
 * @returns {Promise<object>} Dados atualizados do coletivo
 */
const removeMember = async (authHeader, collectiveId, userId) => {
  try {
    const response = await axios.delete(`/api/collectives/${collectiveId}/members/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
    });
    return response.data.data;
  } catch (error) {
    const status = error.response?.status;
    let message;
    if (status === 404) {
      message = "Este participante não faz mais parte do coletivo.";
    } else if (status === 422) {
      message = error.response?.data?.message || "Não foi possível realizar esta ação.";
    } else if (status === 403) {
      message = "Você não tem permissão para realizar esta ação.";
    } else {
      message = "Não foi possível remover o membro. Tente novamente.";
    }
    const err = new Error(message);
    err.status = status;
    throw err;
  }
};

/**
 * Promove um membro para admin do coletivo
 * @param {string} authHeader
 * @param {string} collectiveId
 * @param {string} userId
 * @returns {Promise<object>} Dados atualizados do coletivo
 */
const promoteMemberToAdmin = async (authHeader, collectiveId, userId) => {
  try {
    const response = await axios.put(
      `/api/collectives/${collectiveId}/members/${userId}`,
      { role: "admin" },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Não foi possível atualizar o papel do membro.";
    const err = new Error(message);
    err.status = status;
    throw err;
  }
};

/**
 * Atualiza o papel (role) de um membro no coletivo.
 * @param {string} authHeader
 * @param {string} collectiveId
 * @param {string} userId
 * @param {"admin"|"member"} role
 * @returns {Promise<void>}
 */
const updateMemberRole = async (authHeader, collectiveId, userId, role) => {
  try {
    await axios.put(
      `/api/collectives/${collectiveId}/members/${userId}`,
      { role },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      }
    );
  } catch (error) {
    const status = error.response?.status;
    let message;
    if (status === 422) {
      message = error.response?.data?.message || "Não foi possível realizar esta ação.";
    } else if (status === 403) {
      message = "Você não tem permissão para realizar esta ação.";
    } else {
      message = error.response?.data?.message || "Não foi possível atualizar o papel do membro.";
    }
    const err = new Error(message);
    err.status = status;
    throw err;
  }
};

/**
 * Busca as solicitações de entrada pendentes de um coletivo
 */
const getJoinRequests = async (authHeader, collectiveId) => {
  try {
    const response = await axios.get(`/api/collectives/${collectiveId}/join-requests`, {
      headers: { "Authorization": authHeader },
    });
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Não foi possível carregar as solicitações pendentes."
    );
  }
};

/**
 * Aprova ou recusa uma solicitação de entrada no coletivo.
 * @param {"approve"|"reject"} action
 */
const handleJoinRequest = async (authHeader, collectiveId, userId, action) => {
  try {
    const response = await axios.put(
      `/api/collectives/${collectiveId}/join-requests/${userId}`,
      { action },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      }
    );
    return { alreadyProcessed: false, data: response.data?.data ?? null };
  } catch (error) {
    if (error.response?.status === 404) {
      // A solicitação já foi processada (ex: solicitante cancelou). Trata como sucesso.
      return { alreadyProcessed: true, data: null };
    }
    throw new Error(
      error.response?.data?.message || "Não foi possível processar a solicitação."
    );
  }
};

/* ────────────────────────────────────────────────────────────────────────────
 * Entidades VRAC — criação e resolução
 *
 * Um mapa único, chaveado pela chave usada no payload de sugestão de obra. Cada
 * endpoint devolve o registro sob um envelope próprio, e três deles não derivam
 * do nome do recurso: `vrac-style-periods` → `period`, `vrac-cultural-contexts`
 * → `context` e `vrac-subjects` → `data`. Criar e resolver leem o mesmo mapa,
 * justamente para que os dois caminhos não divirjam.
 *
 * `draftKey` liga a chave do backend à do rascunho do formulário de obra
 * (`useWorkForm`), que usa nomes camelCase próprios.
 * ──────────────────────────────────────────────────────────────────────────── */
const VRAC_ENTITIES = {
  titles:  { endpoint: "vrac-titles", envelope: "title", displayKey: "label" },
  agents:  { endpoint: "vrac-agents", envelope: "agent" },
  dates:   { endpoint: "vrac-dates",  envelope: "date"  },
  style_periods: {
    endpoint: "vrac-style-periods", envelope: "period", displayKey: "label",
    draftKey: "stylePeriods", createPayload: (v) => ({ label: v }),
  },
  cultural_contexts: {
    endpoint: "vrac-cultural-contexts", envelope: "context", displayKey: "label",
    draftKey: "culturalCtxs", createPayload: (v) => ({ label: v, vocab: "Arquigrafia" }),
  },
  work_types: {
    endpoint: "vrac-work-types", envelope: "work_type", displayKey: "label",
    draftKey: "workTypes", createPayload: (v) => ({ label: v, vocab: "Arquigrafia" }),
  },
  techniques: {
    endpoint: "vrac-techniques", envelope: "technique", displayKey: "label",
    draftKey: "techniques", createPayload: (v) => ({ label: v, vocab: "Arquigrafia" }),
  },
  materials: {
    // `type` é obrigatório na prática (a coluna é NOT NULL e o backend nunca usa
    // o default); "medium" é o único valor presente na base.
    endpoint: "vrac-materials", envelope: "material", displayKey: "label",
    draftKey: "materials", createPayload: (v) => ({ label: v, type: "medium", vocab: "Arquigrafia" }),
  },
  subjects: {
    endpoint: "vrac-subjects", envelope: "data", displayKey: "term",
    draftKey: "subjects", createPayload: (v) => ({ term: v, type: "otherTopic", vocab: "Arquigrafia" }),
  },
};

// Só os vocabulários têm termo criável pelo usuário; títulos, agentes e datas
// são sempre registros novos, nunca reaproveitados por texto.
const VRAC_VOCAB_KEYS = Object.keys(VRAC_ENTITIES).filter((k) => VRAC_ENTITIES[k].createPayload);

const createVracTitle = async (authHeader, { label, type, pref }) => {
  const res = await axios.post("/api/vrac-titles", { label, type, pref }, { headers: { Authorization: authHeader } });
  return res.data.title.id;
};

const createVracAgentRole = async (authHeader, label) => {
  const res = await axios.post("/api/vrac-agent-roles", { label: label.toLowerCase() }, { headers: { Authorization: authHeader } });
  return res.data.role;
};

const createVracContributorName = async (authHeader, name) => {
  const res = await axios.post("/api/vrac-contributor-names", { name, type: "personal" }, { headers: { Authorization: authHeader } });
  return res.data.name.id;
};

const createVracAgent = async (authHeader, { contributorNameId, roleId }) => {
  const res = await axios.post(
    "/api/vrac-agents",
    { contributor_name_id: contributorNameId, role_id: roleId },
    { headers: { Authorization: authHeader } },
  );
  return res.data.agent.id;
};

const createVracDate = async (authHeader, date) => {
  const res = await axios.post("/api/vrac-dates", date, { headers: { Authorization: authHeader } });
  return res.data.date.id;
};

/**
 * Procura um termo de vocabulário já existente antes de criar: o backend não
 * deduplica. `%` e `_` são escapados porque a busca é um LIKE cru — curingas não
 * são tratados do lado de lá.
 */
const findExistingVocabId = async (payloadKey, term) => {
  const cfg = VRAC_ENTITIES[payloadKey];
  try {
    const search = term.replace(/[\\%_]/g, "\\$&");
    const res = await axios.get(`/api/${cfg.endpoint}`, { params: { search, per_page: -1 } });
    const items = res.data?.data ?? [];
    const match = items.find((i) => (i[cfg.displayKey] || "").toLowerCase() === term);
    return match?.id || null;
  } catch {
    return null; // Não-fatal: se a busca falhar, seguimos para criar.
  }
};

const createVocabTerm = async (authHeader, payloadKey, term) => {
  const cfg = VRAC_ENTITIES[payloadKey];
  const res = await axios.post(`/api/${cfg.endpoint}`, cfg.createPayload(term), {
    headers: { Authorization: authHeader },
  });
  return res.data[cfg.envelope]?.id || null;
};

/**
 * Resolve um balde `{ existing: [ids], newTerms: [labels] }` do formulário em uma
 * lista final de IDs, reaproveitando termos existentes em vez de duplicar.
 */
const resolveVocabIds = async (authHeader, payloadKey, bucket) => {
  const ids = [...(bucket?.existing || [])];
  for (const term of bucket?.newTerms || []) {
    const lower = (term || "").trim().toLowerCase();
    // Nunca envia termo vazio: sem validação no backend, viraria um 500.
    if (!lower) continue;
    const existingId = await findExistingVocabId(payloadKey, lower);
    if (existingId) {
      ids.push(existingId);
      continue;
    }
    const createdId = await createVocabTerm(authHeader, payloadKey, lower);
    if (createdId) ids.push(createdId);
  }
  return ids;
};

/**
 * Cache global de entidades VRAC resolvidas por ID, compartilhado por todos os
 * componentes — o diff de sugestões repete muito os mesmos termos entre cards, e
 * o backend não tem resolução em lote (uma requisição por UUID).
 *
 * A promessa é cacheada, não só o resultado, para que N pedidos simultâneos do
 * mesmo UUID gerem uma única requisição.
 */
const _vracEntityCache = new Map(); // `${payloadKey}:${id}` → Promise<entidade|null>

const resolveVracEntity = (payloadKey, id) => {
  const cfg = VRAC_ENTITIES[payloadKey];
  if (!cfg || !id) return Promise.resolve(null);

  const cacheKey = `${payloadKey}:${id}`;
  if (_vracEntityCache.has(cacheKey)) return _vracEntityCache.get(cacheKey);

  const promise = axios
    .get(`/api/${cfg.endpoint}/${id}`)
    .then((res) => {
      // Um ID inexistente devolve 200 com o envelope nulo (o backend usa find(),
      // não findOrFail()). Cachear esse null como registro válido envenenaria a
      // entrada, então o miss é descartado do cache.
      const entity = res.data?.[cfg.envelope] ?? null;
      if (!entity) _vracEntityCache.delete(cacheKey);
      return entity;
    })
    .catch(() => {
      _vracEntityCache.delete(cacheKey);
      return null;
    });

  _vracEntityCache.set(cacheKey, promise);
  return promise;
};

/**
 * Texto de exibição de uma entidade VRAC já resolvida. Agentes vêm com
 * `contributorName`/`role` carregados; os demais usam a coluna de texto do
 * próprio vocabulário.
 */
const vracEntityLabel = (payloadKey, entity) => {
  if (!entity) return null;
  if (payloadKey === "agents") {
    return entity.contributorName?.name || entity.contributor_name?.name || null;
  }
  const cfg = VRAC_ENTITIES[payloadKey];
  return cfg?.displayKey ? entity[cfg.displayKey] || null : null;
};

/* ────────────────────────────────────────────────────────────────────────────
 * Sugestões colaborativas de obra
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Sugestões de uma obra — GET /api/work-suggestions. Público; 20 por página.
 */
const getWorkSuggestions = async (workId, { status, page = 1 } = {}) => {
  const params = { work_id: workId, page };
  if (status) params.status = status;
  const response = await axios.get("/api/work-suggestions", { params });
  return {
    items: response.data?.data ?? [],
    meta: response.data?.meta ?? null,
  };
};

const createWorkSuggestion = async (authHeader, workId, payload) => {
  const response = await axios.post(
    `/api/vrac-works/${workId}/suggestions`,
    { payload },
    { headers: { Authorization: authHeader } },
  );
  return response.data?.suggestion ?? null;
};

/**
 * Aceita uma sugestão. `acceptedFields` **nunca** pode ser uma lista vazia: o
 * backend testa `! empty()`, então `[]` cai no mesmo caminho de "ausente" e
 * aceita a sugestão inteira. Para não aceitar nada, use `rejectWorkSuggestion`.
 *
 * Devolve também a obra já atualizada, evitando um GET extra.
 */
const acceptWorkSuggestion = async (authHeader, suggestionId, acceptedFields, reviewNote) => {
  if (Array.isArray(acceptedFields) && acceptedFields.length === 0) {
    throw new Error("acceptWorkSuggestion: lista vazia aceitaria tudo — use rejectWorkSuggestion.");
  }
  const body = {};
  if (acceptedFields) body.accepted_fields = acceptedFields;
  if (reviewNote) body.review_note = reviewNote;

  const response = await axios.post(`/api/work-suggestions/${suggestionId}/accept`, body, {
    headers: { Authorization: authHeader },
  });
  return {
    suggestion: response.data?.suggestion ?? null,
    // Normalizada aqui: a tela espera o mesmo shape de `getWorkDetails`, e o
    // backend devolve o model cru.
    work: normalizeWork(response.data?.work),
  };
};

const rejectWorkSuggestion = async (authHeader, suggestionId, reviewNote) => {
  const body = reviewNote ? { review_note: reviewNote } : {};
  const response = await axios.post(`/api/work-suggestions/${suggestionId}/reject`, body, {
    headers: { Authorization: authHeader },
  });
  return response.data?.suggestion ?? null;
};

/**
 * O usuário enviou alguma imagem desta obra? É o critério para julgar sugestões,
 * calculado no cliente porque `GET /api/vrac-works/{id}` ainda não expõe
 * `can_review`.
 *
 * Pergunta direta ao backend com `user_id` em vez de baixar a lista de
 * contribuidores: basta saber se existe ao menos uma, então `per_page=1` resolve.
 * (`per_page=-1` **não** vale aqui — diferente de `vrac-works`, a listagem de
 * imagens valida `per_page >= 1` e devolve 422.)
 */
const isWorkContributor = async (workId, userId) => {
  if (!workId || !userId) return false;
  try {
    const response = await axios.get("/api/images", {
      params: { "work[]": workId, user_id: userId, per_page: 1 },
    });
    const total = response.data?.meta?.total;
    if (typeof total === "number") return total > 0;
    return (response.data?.data ?? []).length > 0;
  } catch {
    // Não-fatal: sem essa resposta a pessoa apenas não vê os botões de decisão.
    return false;
  }
};

export const api = {
  getImages: fetchImages,
  getGeoJSON,
  getLocationsGeoJSON,
  getFilteredLocationsGeoJSON,
  getImageDetails,
  getImageComments,
  getRelatedImages,
  getWorkDetails,
  normalizeWork,
  getWorkImages,
  searchVocab,
  searchImages,
  getTotalImages,
  getSubjectById,
  getAllSubjects,
  getMaterialById,
  getAllMaterials,
  getTechniqueById,
  getAllTechniques,
  getStylePeriodById,
  getAllStylePeriods,
  getCulturalContextById,
  getAllCulturalContexts,
  getWorkTypeById,
  getAllWorkTypes,
  deleteImage,
  createCollective,
  getCollective,
  requestJoinCollective,
  leaveCollective,
  updateCollective,
  removeMember,
  promoteMemberToAdmin,
  updateMemberRole,
  getJoinRequests,
  handleJoinRequest,
  // entidades VRAC
  VRAC_ENTITIES,
  VRAC_VOCAB_KEYS,
  createVracTitle,
  createVracAgentRole,
  createVracContributorName,
  createVracAgent,
  createVracDate,
  findExistingVocabId,
  createVocabTerm,
  resolveVocabIds,
  resolveVracEntity,
  vracEntityLabel,
  // sugestões de obra
  getWorkSuggestions,
  createWorkSuggestion,
  acceptWorkSuggestion,
  rejectWorkSuggestion,
  isWorkContributor,
};
