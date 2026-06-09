import { ref, computed, markRaw, watch } from "vue";
import { useVracStore } from "@/store/vrac";
import { useAuthStore } from "@/store/auth";
import { storeToRefs } from "pinia";
import { formatDate, parseYearFromDateString } from "@/helpers/dateUtils";
import Fuse from "fuse.js";


export function useImageForm() {
  const vracStore = useVracStore();
  const authStore = useAuthStore();
  const { loggedUser } = storeToRefs(authStore);

  // ─── Tabs
  const tabs = [
    { label: "Essenciais", section: "essenciais" },
    { label: "Geral", section: "geral" },
    { label: "Localização", section: "localizacao" },
  ];

  const currentSection = ref("essenciais");
  const selectTab = (section) => { currentSection.value = section; };

  // ─── Alert 
  const showAlert = ref(false);
  const alertMessage = ref("");
  const alertType = ref("error");

  const showError = (message) => {
    alertType.value = "error";
    alertMessage.value = message;
    showAlert.value = true;
  };

  const showSuccess = (message) => {
    alertType.value = "success";
    alertMessage.value = message;
    showAlert.value = true;
  };

  // ─── Identidade (publicar como) 
  const isIdentityDropdownOpen = ref(false);
  const selectedIdentityId = ref(null);

  const getInitials = (name) => name?.charAt(0).toUpperCase() || "?";

  const publishingIdentities = computed(() => {
    if (!loggedUser.value) return [];
    const user = loggedUser.value;
    const identities = [
      {
        id: user.id,
        type: "user",
        name: user.name || user.username,
        avatar: user.avatar || null,
        initials: user.initials || getInitials(user.name || user.username),
      },
    ];
    if (Array.isArray(user.collectives)) {
      for (const collective of user.collectives) {
        identities.push({
          id: collective.id,
          type: "collective",
          name: collective.name,
          avatar: collective.avatar_path || null,
          initials: getInitials(collective.name),
        });
      }
    }
    return identities;
  });

  const selectedIdentity = computed(() => {
    if (!publishingIdentities.value.length) return null;
    if (!selectedIdentityId.value) return publishingIdentities.value[0];
    return (
      publishingIdentities.value.find((i) => i.id === selectedIdentityId.value) ||
      publishingIdentities.value[0]
    );
  });

  const hasCollectives = computed(
    () =>
      Array.isArray(loggedUser.value?.collectives) &&
      loggedUser.value.collectives.length > 0
  );

  const availableIdentities = computed(() =>
    publishingIdentities.value.filter(
      (identity) => identity.id !== selectedIdentity.value?.id
    )
  );

  const toggleIdentityDropdown = () => {
    isIdentityDropdownOpen.value = !isIdentityDropdownOpen.value;
  };

  const selectIdentity = (identity) => {
    selectedIdentityId.value = identity.id;
    isIdentityDropdownOpen.value = false;
  };

  // ─── Form state 
  const defaultForm = {
    title: "",
    isAuthor: true,
    isPublicDomain: false,
    authorName: "",
    unknownAuthor: false,
    hasAuthorization: true,
    work: "",
    tags: [],
    description: "",
    date: "",
    dateEnd: "",
    dateType: "year",
    dateAccuracy: "exact",
    location: "",
    coordinates: null,
  };

  const form = ref({ ...defaultForm });

  watch(() => form.value.dateType, (newType) => {
    if (newType === "year") {
      // Sincroniza dateEnd com date ao voltar para ano único
      const year = parseYearFromDateString(form.value.date);
      if (year) {
        form.value.dateEnd = yearToDateString(year, true);
      }
    }
  });

  const resetForm = () => {
    form.value = { ...defaultForm, tags: [] };
    isTitleTouched.value = false;
    isAuthorNameTouched.value = false;
  };

  // ─── Validações
  const isTitleTouched = ref(false);
  const isAuthorNameTouched = ref(false);

  const isTitleInvalid = computed(
    () => isTitleTouched.value && !form.value.title.trim()
  );

  const isAuthorNameInvalid = computed(() => {
    const shouldValidate =
      !form.value.isAuthor &&
      !form.value.isPublicDomain &&
      form.value.hasAuthorization &&
      !form.value.unknownAuthor;
    return (
      shouldValidate &&
      isAuthorNameTouched.value &&
      !form.value.authorName.trim()
    );
  });

  const isRightsInvalid = computed(
    () =>
      !form.value.isAuthor &&
      !form.value.isPublicDomain &&
      !form.value.hasAuthorization
  );

  const isEssenciaisInvalid = computed(
    () => isRightsInvalid.value || isTitleInvalid.value || isAuthorNameInvalid.value
  );

  const isFormValid = computed(() => {
    if (!form.value.title?.trim()) { return false; }
    if (form.value.isAuthor || form.value.isPublicDomain) { return true; }
    if (!form.value.hasAuthorization && !form.value.unknownAuthor) { return false; }
    if (
      form.value.hasAuthorization &&
      !form.value.unknownAuthor &&
      !form.value.authorName?.trim()
    ) {
      return false;
    }
    return true;
  });

  const touchAllFields = () => {
    isTitleTouched.value = true;
    isAuthorNameTouched.value = true;
  };

  // ─── Data helpers ────────────────────────────────────────────────────────────
  const yearToDateString = (year, isEnd = false) => {
    if (!year) return "";
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear)) return "";
    return formatDate(parsedYear, isEnd ? 12 : 1, isEnd ? 31 : 1);
  };

  const dateYearInput = computed({
    get() {
      const dateStr = form.value.date;
      if (!dateStr) return "";
      const year = parseYearFromDateString(dateStr);
      return year ? year.toString() : "";
    },
    set(yearStr) {
      form.value.date = yearToDateString(yearStr, false);
      form.value.dateEnd = yearToDateString(yearStr, true);
    },
  });

  const dateEndYearInput = computed({
    get() {
      const dateStr = form.value.dateEnd;
      if (!dateStr) return "";
      const year = parseYearFromDateString(dateStr);
      return year ? year.toString() : "";
    },
    set(yearStr) {
      form.value.dateEnd = yearToDateString(yearStr, true);
    },
  });

  // ─── Mapa ────────────────────────────────────────────────────────────────────
  const mapStyleUrl = "https://tiles.openfreemap.org/styles/positron";
  const mapCenter = [-51.9253, -14.235];
  const mapZoom = 2;
  const mapInstance = ref(null);

  const handleMapReady = (map) => { mapInstance.value = markRaw(map); };
  const handleMapError = (error) => { console.error("Erro no mapa:", error); };
  const handleMapClick = ({ lng, lat }) => { form.value.coordinates = { lng, lat }; };
  const zoomIn = () => { mapInstance.value?.zoomIn(); };
  const zoomOut = () => { mapInstance.value?.zoomOut(); };

  // ─── Localização / geocoding ─────────────────────────────────────────────────
  const locationSuggestions = ref([]);
  const showLocationSuggestions = ref(false);
  const isSearchingLocation = ref(false);

  const searchLocation = async () => {
    const query = form.value.location.trim();
    if (!query || query.length < 3) {
      locationSuggestions.value = [];
      return;
    }
    isSearchingLocation.value = true;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        { headers: { "Accept-Language": "pt-BR,pt" } }
      );
      locationSuggestions.value = await response.json();
      showLocationSuggestions.value = true;

    } catch (error) {
      console.warn("Erro ao buscar localidade:", error);
    } finally {
      isSearchingLocation.value = false;
    }
  };

  const selectLocationSuggestion = (suggestion) => {
    const lng = parseFloat(suggestion.lon);
    const lat = parseFloat(suggestion.lat);
    form.value.location = suggestion.display_name;
    form.value.coordinates = { lng, lat };
    mapInstance.value?.flyTo({ center: [lng, lat], zoom: 14 });
    locationSuggestions.value = [];
    showLocationSuggestions.value = false;
  };

  const hideLocationSuggestions = () => {
    setTimeout(() => { showLocationSuggestions.value = false; }, 200);
  };

  // ─── Tags / subjects ─────────────────────────────────────────────────────────
  const tagInput = ref("");
  const allSubjects = ref([]);
  const filteredTagSuggestions = ref([]);
  const showTagSuggestions = ref(false);
  const isCreatingSubject = ref(false);
  let fuseInstance = null;
  let debounceTimer = null;

  const canCreateSubject = computed(() => {
    const term = tagInput.value.trim();
    if (!term) return false;
    if (form.value.tags.some(t => (t.term ?? t).toLowerCase() === term.toLowerCase())) return false;
    return !allSubjects.value.some(
      (s) => s.term.toLowerCase() === term.toLowerCase()
    );
  });

  const initFuse = () => {
    fuseInstance = new Fuse(allSubjects.value, {
      keys: ["term"],
      threshold: 0.3,
      includeScore: true,
    });
  };

  const onTagInputChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!tagInput.value.trim()) {
        filteredTagSuggestions.value = [];
        return;
      }
      if (fuseInstance) {
        filteredTagSuggestions.value = fuseInstance
          .search(tagInput.value)
          .map((r) => r.item)
          .filter((item) => !form.value.tags.some(t => (t.term ?? t) === item.term))
          .slice(0, 10);
      }
    }, 300);
  };

  const hideTagSuggestions = () => {
    setTimeout(() => { showTagSuggestions.value = false; }, 200);
  };

  const selectTagSuggestion = (subject) => {
    if (!form.value.tags.some(t => t.id === subject.id)) {
      form.value.tags.push({ id: subject.id, term: subject.term });
    }
    tagInput.value = "";
    filteredTagSuggestions.value = [];
    showTagSuggestions.value = false;
  };

  const createAndAddSubject = async (term) => {
    if (!term || form.value.tags.some(t => (t.term ?? t).toLowerCase() === term.toLowerCase()) || isCreatingSubject.value) return;
    isCreatingSubject.value = true;
    try {
      const response = await vracStore.addVRACSubject(term);
      const subjectData = response?.data?.data || response?.data || response;
      if (subjectData?.id && subjectData?.term) {
        const alreadyLoaded = allSubjects.value.some(s => s.id === subjectData.id);
        if (!alreadyLoaded) {
          allSubjects.value.push(subjectData);
          initFuse();
        }
        form.value.tags.push({ id: subjectData.id, term: subjectData.term });
      }
      tagInput.value = "";
      filteredTagSuggestions.value = [];
      showTagSuggestions.value = false;
    } catch {
      showError("Não foi possível criar o assunto. Tente novamente.");
    } finally {
      isCreatingSubject.value = false;
    }
  };

  const addTag = async () => {
    const term = tagInput.value.trim();
    if (!term) return;
    if (form.value.tags.some(t => (t.term ?? t).toLowerCase() === term.toLowerCase())) {
      tagInput.value = "";
      return;
    }
    const exactMatch = allSubjects.value.find(
      (s) => s.term.toLowerCase() === term.toLowerCase()
    );
    if (exactMatch) {
      selectTagSuggestion(exactMatch);
    } else {
      await createAndAddSubject(term);
    }
  };

  const removeTag = (index) => { form.value.tags.splice(index, 1); };

  // ─── Contribuidores ──────────────────────────────────────────────────────────
  const allContributorNames = ref([]);

  /**
   * Resolve o UUID do fotógrafo a partir do nome.
   * Cria o contribuidor na API se ainda não existir.
   */
  const resolvePhotographerUuid = async (metadata) => {
    if (metadata.isAuthor) return null;

    const photographerName = metadata.authorName?.trim();
    if (!photographerName) return null;

    let contributor = allContributorNames.value.find(
      (c) => c.name.toLowerCase() === photographerName.toLowerCase()
    );

    if (!contributor) {
      const newContributor = await vracStore.addVRACContributorName(photographerName);
      if (newContributor?.name) {
        contributor = newContributor.name;
        allContributorNames.value.push(contributor);
      }
    }

    return contributor?.id || null;
  };

  /**
   * Converte as tags (terms) do form para seus UUIDs na API.
   */
  // const resolveSubjectUuids = (tags = []) =>
  //   tags
  //     .map((tagTerm) => allSubjects.value.find((s) => s.term === tagTerm)?.id)
  //     .filter(Boolean);

  const resolveSubjectUuids = (tags = []) => {
    return tags
      .map(tag => {
        if (tag?.id) return tag.id;
        const term = tag?.term ?? tag;
        return allSubjects.value.find(
          s => s.term.toLowerCase() === term.toLowerCase()
        )?.id;
      })
      .filter(Boolean);
  };


  // ─── Inicialização (chamar no onMounted do componente pai) ───────────────────
  /**
   * Carrega subjects e contributors da API.
   * Deve ser chamado no onMounted de quem usar o composable.
   */
  const loadFormDependencies = async () => {
    const subjectsResponse = await vracStore.getVRACSubjects();
    if (subjectsResponse?.data && Array.isArray(subjectsResponse.data)) {
      allSubjects.value = subjectsResponse.data;
      initFuse();
    }

    const contributorsResponse = await vracStore.getVRACContributorNames();
    if (contributorsResponse?.names && Array.isArray(contributorsResponse.names)) {
      allContributorNames.value = contributorsResponse.names;
    }
  };

  /**
   * Popula o form a partir dos dados retornados pela API (modo edição/sugestão).
   * O mapeamento fica centralizado aqui para reusar em Edit e Suggest.
   */

  console.log("allSubjects:", allSubjects.value);
  console.log("allSubjects-length:", allSubjects.value.length);
  console.log("tags:", form.value.tags);

  const populateFormFromApi = (data, currentUserName = null) => {
    const authorName = data.authors?.[0] || data.rights?.[0]?.rights_holder || "";
    const isAuthor = !!currentUserName && (
      data.authors?.some(a => a === currentUserName) ?? false
    );
    const dateRaw = data.dateRaw;
    const earliestYear = dateRaw?.earliest_date
      ? new Date(dateRaw.earliest_date).getUTCFullYear()
      : null;
    const latestYear = dateRaw?.latest_date
      ? new Date(dateRaw.latest_date).getUTCFullYear()
      : null;

    const coords =
      Array.isArray(data.locationCoordinates) &&
        data.locationCoordinates.length === 2 &&
        !isNaN(data.locationCoordinates[0]) &&
        !isNaN(data.locationCoordinates[1]) &&
        data.locationCoordinates[0] !== 0 &&
        data.locationCoordinates[1] !== 0
        ? { lat: data.locationCoordinates[0], lng: data.locationCoordinates[1] }
        : null;

    form.value = {
      ...defaultForm,
      title: data.title || "",
      authorName: isAuthor ? "" : authorName,
      isAuthor,
      isPublicDomain: false,
      hasAuthorization: !isAuthor,
      unknownAuthor: !authorName,
      license: data.rights?.[0]?.text || "CC BY-NC-SA",
      description: data.description || "",
      tags: (data.subjects || []).map((s) =>
        typeof s === "object" ? { id: s.id, term: s.term } : { term: s }
      ),
      date: earliestYear ? `${earliestYear}-01-01` : "",
      dateEnd: latestYear ? `${latestYear}-12-31` : "",
      dateType: earliestYear && latestYear && earliestYear !== latestYear ? "interval" : "year",
      dateAccuracy: dateRaw?.circa ? "approximate" : "exact",
      location: data.location || "",
      coordinates: coords,
    };
  };

  return {
    // tabs
    tabs,
    currentSection,
    selectTab,

    // alert
    showAlert,
    alertMessage,
    alertType,
    showError,
    showSuccess,

    // identidade
    isIdentityDropdownOpen,
    selectedIdentityId,
    selectedIdentity,
    hasCollectives,
    availableIdentities,
    toggleIdentityDropdown,
    selectIdentity,

    // form
    form,
    defaultForm,
    resetForm,
    populateFormFromApi,

    // validação
    isTitleTouched,
    isAuthorNameTouched,
    isTitleInvalid,
    isAuthorNameInvalid,
    isRightsInvalid,
    isEssenciaisInvalid,
    isFormValid,
    touchAllFields,

    // datas
    dateYearInput,
    dateEndYearInput,

    // mapa
    mapStyleUrl,
    mapCenter,
    mapZoom,
    mapInstance,
    handleMapReady,
    handleMapError,
    handleMapClick,
    zoomIn,
    zoomOut,

    // localização
    locationSuggestions,
    showLocationSuggestions,
    searchLocation,
    selectLocationSuggestion,
    hideLocationSuggestions,
    isSearchingLocation,

    // tags
    tagInput,
    allSubjects,
    filteredTagSuggestions,
    showTagSuggestions,
    isCreatingSubject,
    canCreateSubject,
    onTagInputChange,
    hideTagSuggestions,
    selectTagSuggestion,
    createAndAddSubject,
    addTag,
    removeTag,

    // contribuidores / subjects
    allContributorNames,
    resolvePhotographerUuid,
    resolveSubjectUuids,

    // init
    loadFormDependencies,
  };
}