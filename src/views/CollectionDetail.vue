<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import { useUsersStore } from "@/store/users";
import { useCollectivesStore } from "@/store/collectives";
import defaultProfileImage from "@/assets/profile_image.png";
import collectiveImageDefault from "@/assets/collective_image.png";
import CollectionPeriodsChart from "@/components/CollectionPeriodsChart.vue";
import UiField from "@/components/ui/UiField.vue";
import CollectionImagesGrid from "@/components/collection/CollectionImagesGrid.vue";
import CollectionImagesMosaic from "@/components/collection/CollectionImagesMosaic.vue";
import CollectionImagesMap from "@/components/collection/CollectionImagesMap.vue";
import CollectionPathMap from "@/components/collection/CollectionPathMap.vue";
import {
  viewRouteToSelection,
  selectionToViewRoute,
  selectionToViewMode,
} from "@/constants/viewModes";
import CollectionToolbar from "@/components/CollectionToolbar.vue";
import DownloadModal from "@/components/imageDetail/DownloadModal.vue";
import CollectionPathModal from "@/components/collection/CollectionPathModal.vue";
import CollectionPathStops from "@/components/collection/CollectionPathStops.vue";
import CollectionMapSelection from "@/components/collection/CollectionMapSelection.vue";
import { orderPathStops } from "@/helpers/pathStops";
import { formatRouteDistance, formatRouteDuration } from "@/helpers/osrmRoute";
import UiExpandableText from "@/components/ui/UiExpandableText.vue";
import AppToast from "@/components/ui/AppToast.vue";
import { useToast } from "@/composables/useToast";
import { downloadCollectionAsZip } from "@/helpers/downloadCollectionZip";
import { sanitizeDownloadFilename } from "@/helpers/downloadImage";
import { useAlbumImagesInfiniteQuery } from "@/composables/useAlbumImagesInfiniteQuery";

defineOptions({ name: "CollectionDetail" });

const usersStore = useUsersStore();
const collectivesStore = useCollectivesStore();
const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const ownerUser = ref(null);
// Dono do tipo coletivo (quando a coleção pertence a um coletivo).
const collective = ref(null);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();

const isLoadingOwner = ref(true);
// Percurso da coleção (API: GET/POST/PUT /albums/{id}/percursos).
const showPathModal = ref(false);
/** @type {import('vue').Ref<'create' | 'delete'>} */
const pathModalMode = ref("create");
/** @type {import('vue').Ref<{ id: string, title?: string|null, stops: any[], route: any } | null>} */
const activePercurso = ref(null);
// A coleção é um percurso quando há um percurso salvo para ela.
const isCollectionPath = computed(() => Boolean(activePercurso.value));
// Editor de percurso aberto (mapa em tela cheia).
const isPathEditorOpen = ref(false);
const isSavingPath = ref(false);
// Feedback do salvamento do percurso (AppToast + useToast). Um toast por vez.
const {
  toasts: pathToasts,
  show: showToast,
  hide: hideToast,
  pause: pauseToast,
  resume: resumeToast,
} = useToast({ max: 1 });

function closePathAlert() {
  [...pathToasts.value].forEach((toast) => hideToast(toast.id));
}

function showPathAlert(message, type = "error") {
  closePathAlert();
  showToast(message, type);
}
const EMPTY_PATH_STOPS = Object.freeze([]);
const pathInitialStops = computed(
  () => activePercurso.value?.stops ?? EMPTY_PATH_STOPS
);
const pathInitialRoute = computed(() => activePercurso.value?.route ?? null);

// Paradas numeradas na ordem de visita (mesma numeração da lista e do mapa).
const orderedPathStops = computed(() => orderPathStops(pathInitialStops.value));

// Resumo do percurso: "5 pontos · 2.3 km · ~30 min a pé". Distância e tempo só
// quando a rota segue as ruas (no fallback em linha reta não são confiáveis).
const pathSummary = computed(() => {
  const count = orderedPathStops.value.length;
  if (!count) return "";

  const parts = [`${count} ${count === 1 ? "ponto" : "pontos"}`];
  const routeData = pathInitialRoute.value;

  if (routeData?.isStreet !== false) {
    const distance = formatRouteDistance(routeData?.distanceMeters);
    const duration = formatRouteDuration(routeData?.durationSeconds);
    if (distance) parts.push(distance);
    if (duration) parts.push(`~${duration} a pé`);
  }

  return parts.join(" · ");
});

const isMapView = computed(() => collectionViewMode.value === "map");

// Edição de percurso no mapa: os detalhes da coleção ficam ocultos e o mapa
// ocupa a largura toda da tela.
const isPathEditing = computed(() => isPathEditorOpen.value && isMapView.value);

// Os pontos do percurso só aparecem na visualização de mapa.
const showPathStops = computed(() => isCollectionPath.value && isMapView.value);

function openPathModal(mode) {
  pathModalMode.value = mode;
  showPathModal.value = true;
}

function openPathEditor() {
  isPathEditorOpen.value = true;

  if (collectionViewMode.value !== "map") {
    handleCollectionViewChange({ selection: "map" });
  }
}

// Fora do mapa (grid/mosaico) o percurso é acessado pela visualização de mapa.
function openPathView() {
  handleCollectionViewChange({ selection: "map" });
}

// "Criar percurso": o modal depende de quantas imagens têm localização.
function openCreatePathModal() {
  const status = imagesLocationStatus.value;
  if (status === "none") openPathModal("create-blocked");
  else if (status === "partial") openPathModal("create-partial");
  else openPathModal("create");
}

function onPathModalConfirm() {
  if (pathModalMode.value === "delete") {
    deletePercurso();
    return;
  }
  if (pathModalMode.value === "create-blocked") {
    // Revisar imagens: mosaico (no mobile só existe o grid).
    handleCollectionViewChange({ selection: isMobile.value ? "grid" : "mosaic" });
    return;
  }
  openPathEditor();
}

// Apaga o percurso salvo: a coleção continua a mesma, só perde o percurso.
async function deletePercurso() {
  if (!canManage.value || !userAuthHeader.value) {
    showPathAlert("Você não tem permissão para apagar este percurso.", "error");
    return;
  }

  isSavingPath.value = true;
  closePathAlert();

  try {
    // PUT com lista vazia: percursos omitidos são removidos.
    await albumsStore.syncPercursos(userAuthHeader.value, collectionId.value, []);
    activePercurso.value = null;
    isPathEditorOpen.value = false;
    showPathAlert("Percurso apagado.", "success");
  } catch (err) {
    showPathAlert(err?.message || "Não foi possível apagar o percurso.", "error");
  } finally {
    isSavingPath.value = false;
  }
}

async function fetchPercursos() {
  if (!collectionId.value) return;

  try {
    const list = await albumsStore.getPercursos(
      userAuthHeader.value,
      collectionId.value
    );
    const first = Array.isArray(list) && list.length ? list[0] : null;
    activePercurso.value = first;
  } catch (err) {
    console.warn("Falha ao carregar percursos:", err);
    activePercurso.value = null;
  }
}

async function onPathMapSave(payload = {}) {
  if (payload.error) {
    showPathAlert(payload.error, "error");
    return;
  }

  const { stops, route } = payload;
  if (!stops?.length || !route) return;

  if (!canManage.value || !userAuthHeader.value) {
    showPathAlert("Você não tem permissão para salvar este percurso.", "error");
    return;
  }

  isSavingPath.value = true;
  closePathAlert();

  const body = {
    title: activePercurso.value?.title ?? null,
    stops,
    route,
  };

  try {
    if (activePercurso.value?.id) {
      const list = await albumsStore.syncPercursos(
        userAuthHeader.value,
        collectionId.value,
        [{ id: activePercurso.value.id, ...body }]
      );
      const saved = list[0];
      // Mantém stops/route enviados para não disparar re-hidratação/zoom no mapa.
      activePercurso.value = {
        id: saved?.id ?? activePercurso.value.id,
        title: saved?.title ?? body.title,
        stops: body.stops,
        route: body.route,
      };
    } else {
      const created = await albumsStore.createPercurso(
        userAuthHeader.value,
        collectionId.value,
        body
      );
      activePercurso.value = {
        id: created?.id,
        title: created?.title ?? body.title,
        stops: body.stops,
        route: body.route,
      };
    }
    // "Salvar e continuar": sai do editor para o mapa com a coluna de detalhes.
    isPathEditorOpen.value = false;
    isInfoActive.value = true;
    showPathAlert("Percurso salvo com sucesso!", "success");
  } catch (err) {
    showPathAlert(err?.message || "Não foi possível salvar o percurso.", "error");
  } finally {
    isSavingPath.value = false;
  }
}

function onPathMapBack() {
  isPathEditorOpen.value = false;
  closePathAlert();
}

const collectionId = computed(() => route.params.collectionId);

// Para visitantes não logados não enviamos header de autorização
// (authStore.authHeader resolveria para "Bearer null" sem token).
const userAuthHeader = computed(() =>
  authStore.isLoggedIn ? authStore.authHeader : null
);

const albumData = ref(null);
const isLoadingAlbum = ref(true);
// null = ok | "forbidden" | "notfound" | "error"
const accessState = ref(null);

const albumImagesEnabled = computed(
  () => Boolean(collectionId.value) && Boolean(albumData.value) && !accessState.value
);

const {
  items: collectionImages,
  hasNextPage,
  fetchNextPage,
  isPending: isImagesPending,
  isFetchingNextPage,
} = useAlbumImagesInfiniteQuery({
  albumId: collectionId,
  authHeader: userAuthHeader,
  enabled: albumImagesEnabled,
});

/**
 * Localização das imagens da coleção (imagem sem localização não aparece no mapa),
 * a partir das contagens do GET /albums/{id}.
 * "none" | "partial" | "all" | null (sem dados ou coleção vazia).
 */
const imagesLocationStatus = computed(() => {
  const total = Number(albumData.value?.images_count);
  const located = Number(albumData.value?.located_images_count);
  if (!Number.isFinite(total) || !Number.isFinite(located) || total === 0) return null;
  if (located === 0) return "none";
  return located < total ? "partial" : "all";
});

const PARTIAL_LOCATION_MESSAGE =
  "Nem todas as imagens dessa coleção possuem localização. Para ter uma visão completa, registre a localização em todas as imagens.";

// Aviso de localização (grid, mosaico e mapa), dentro do bloco "Percurso da coleção":
// "none" para todos, "partial" só para quem gerencia.
const locationNotice = computed(() => {
  if (imagesLocationStatus.value === "none") {
    return "Atenção: as imagens dessa coleção não possuem localização.";
  }
  if (imagesLocationStatus.value === "partial" && canManage.value) {
    return PARTIAL_LOCATION_MESSAGE;
  }
  return null;
});

// Aviso no editor de percurso (canto inferior esquerdo do mapa).
const pathEditorLocationWarning = computed(() =>
  imagesLocationStatus.value === "partial" ? PARTIAL_LOCATION_MESSAGE : null
);

const isLoadingCollection = computed(
  () =>
    isLoadingAlbum.value ||
    (albumImagesEnabled.value &&
      isImagesPending.value &&
      collectionImages.value.length === 0)
);

// título e descrição reais vindos da API
const collectionTitle = computed(() => {
  return albumData.value?.title?.trim() || "Sem título";
});

// descrição reais vindos da API
const collectionDescription = computed(() => {
  return albumData.value?.description?.trim() || "Sem descrição.";
});

// status de visibilidade da coleção (pública/privada)
const isPrivate = computed(() => !!albumData.value?.is_private);

const visibilityLabel = computed(() =>
  isPrivate.value ? "Coleção privada" : "Coleção pública"
);

// Botão "Visualizar percurso": para todos, fora do mapa, quando a coleção tem percurso.
const showPathViewBlock = computed(() => isCollectionPath.value && !isMapView.value);

// "Essa coleção não tem um percurso.": para quem não gerencia. Espera a coleção e o dono
// carregarem para um membro do coletivo não ver a frase piscar antes de canManage resolver.
const showNoPathMessage = computed(
  () =>
    !isLoadingAlbum.value &&
    !isLoadingOwner.value &&
    !isCollectionPath.value &&
    !canManage.value
);

// Bloco "Percurso da coleção" público, abaixo do dono. Também recebe o aviso de
// localização quando o bloco de gerenciar não está visível.
const showPathPublicBlock = computed(
  () =>
    showPathViewBlock.value ||
    showNoPathMessage.value ||
    (Boolean(locationNotice.value) && !showPathManageBlock.value)
);
const pathPublicHelp = computed(() =>
  isCollectionPath.value
    ? "Veja os pontos e a rota do percurso na visualização de mapa."
    : "Percurso com pontos e rota no mapa, criado a partir das imagens desta coleção."
);

// Bloco "Percurso da coleção" (gerenciar): abaixo do dono, só para quem gerencia.
// Criar fica sempre disponível; editar/apagar só na visualização de mapa.
const showPathManageBlock = computed(
  () => canManage.value && (!isCollectionPath.value || isMapView.value)
);
const pathManageHelp = computed(() =>
  isCollectionPath.value
    ? "Edite os pontos e a rota no mapa, ou apague o percurso. As imagens da coleção não são alteradas."
    : "Crie um percurso com pontos e rota no mapa a partir das imagens desta coleção."
);

// O dono do álbum é polimórfico: coletivo (collective_id) ou usuário (user_id).
const isCollectiveOwned = computed(() => !!albumData.value?.collective_id);

// Destino do link do dono da coleção: página do coletivo ou perfil público do usuário.
const ownerProfileTo = computed(() => {
  if (!albumData.value) return null;
  if (albumData.value.collective_id) {
    return { name: "collective-detail", params: { id: albumData.value.collective_id } };
  }
  if (albumData.value.user_id) {
    return { name: "view-profile", params: { id: albumData.value.user_id } };
  }
  return null;
});

// Nome exibido do dono (coletivo ou usuário).
const ownerName = computed(() => {
  if (isCollectiveOwned.value) return collective.value?.name?.trim() || "Coletivo";
  return ownerUser.value?.name?.trim() || "Usuário desconhecido";
});

// Rótulo da seção do dono.
const ownerTitle = computed(() =>
  isCollectiveOwned.value ? "Coleção do coletivo" : "Coleção criada por"
);

// Quem pode gerenciar (editar): membro do coletivo ou o próprio dono usuário.
const canManage = computed(() => {
  const user = authStore.loggedUser;
  if (!authStore.isLoggedIn || !user || !albumData.value) return false;
  if (albumData.value.collective_id) {
    return collective.value?.members?.some((m) => m.id === user.id) ?? false;
  }
  return albumData.value.user_id === user.id;
});

// Navega para a busca filtrada por subject na home, em modo grid:
// /explore/acervo/grid?subject[]=<id>
function goToSubject(subjectId) {
  if (!subjectId) return;
  router.push({
    name: "explore",
    params: { viewMode: "grid" },
    query: { "subject[]": subjectId },
  });
}

// avatar do proprietário da coleção (coletivo ou usuário)
const ownerAvatarSrc = computed(() => {
  const source = isCollectiveOwned.value ? collective.value : ownerUser.value;
  const avatarUrl = source?.avatar_url;
  const avatarPath = source?.avatar_path;

  // Caso já venha URL completa da API/CDN
  if (avatarUrl && /^https?:\/\//.test(avatarUrl)) {
    return avatarUrl;
  }

  // Caso venha caminho relativo em avatar_url
  if (avatarUrl) {
    return `${API_BASE_URL}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
  }

  // Caso backend retorne avatar_path (mesmo padrão do ProfileCard)
  if (avatarPath) {
    return `${API_BASE_URL}/storage/${avatarPath}`;
  }

  return isCollectiveOwned.value ? collectiveImageDefault : defaultProfileImage;

});

// Busca os dados da coleção, tratando o acesso (403/404). O header de
// autorização é opcional: visitantes não logados veem coleções públicas.
async function fetchCollectionData() {
  if (!collectionId.value) return;

  isLoadingAlbum.value = true;
  isLoadingOwner.value = true;
  accessState.value = null;
  isPathEditorOpen.value = false;

  const result = await albumsStore.getAlbumDetail(
    userAuthHeader.value,
    collectionId.value
  );

  if (!result.success) {
    albumData.value = null;
    collectionTags.value = [];
    isLoadingCollectionTags.value = false;
    ownerUser.value = null;
    collective.value = null;
    activePercurso.value = null;
    isPathEditorOpen.value = false;
    closePathAlert();
    isLoadingOwner.value = false;
    if (result.status === 403) {
      accessState.value = "forbidden";
    } else if (result.status === 404) {
      accessState.value = "notfound";
    } else {
      accessState.value = "error";
    }
    isLoadingAlbum.value = false;
    return;
  }

  albumData.value = result.data;

  await Promise.all([loadCollectionTags(), fetchPercursos()]);
  isLoadingAlbum.value = false;

  // Resolve o dono conforme o tipo do álbum (coletivo ou usuário).
  if (result.data.collective_id) {
    await fetchCollective(result.data.collective_id);
  } else if (result.data.user_id) {
    await fetchOwnerUser(result.data.user_id);
  } else {
    isLoadingOwner.value = false;
  }
}

// Busca os dados do coletivo dono (nome, avatar, membros).
async function fetchCollective(id) {
  isLoadingOwner.value = true;
  try {
    const result = await collectivesStore.getCollective(id);
    collective.value = result.success ? result.data : null;
  } finally {
    isLoadingOwner.value = false;
  }
}

// Busca os dados do usuário dono.
async function fetchOwnerUser(userId) {
  isLoadingOwner.value = true;
  try {
    ownerUser.value = await usersStore.getUser(userId);
  } catch (e) {
    ownerUser.value = null;
  } finally {
    isLoadingOwner.value = false;
  }
}

/**
 * Start: Toolbar
*/
const viewSelection = computed(() =>
  viewRouteToSelection(route.params.viewMode)
);

const collectionViewMode = computed(() =>
  selectionToViewMode(viewSelection.value)
);

const selectedMapImageId = ref(
  typeof route.query.image === "string" ? route.query.image : null
);

const selectedMapImage = computed(() =>
  collectionImages.value.find((img) => img.id === selectedMapImageId.value) || null
);

// Zoom ao focar um ponto do percurso: acima do clusterMaxZoom do mapa (14),
// para o ícone do ponto aparecer fora do agrupamento.
const PATH_STOP_ZOOM = 15;

// Ponto sem imagem (no mapa) aberto no card de seleção.
const selectedStopNumber = ref(null);

// Ponto do percurso da seleção atual: o da imagem selecionada ou o ponto sem imagem.
const selectedPathStop = computed(() => {
  if (selectedMapImage.value) {
    const imageId = String(selectedMapImage.value.id);
    return orderedPathStops.value.find((stop) => stop.imageId === imageId) ?? null;
  }
  return (
    orderedPathStops.value.find((stop) => stop.number === selectedStopNumber.value) ?? null
  );
});

const previousPathStop = computed(() =>
  selectedPathStop.value
    ? orderedPathStops.value[selectedPathStop.value.number - 2] ?? null
    : null
);

const nextPathStop = computed(() =>
  selectedPathStop.value
    ? orderedPathStops.value[selectedPathStop.value.number] ?? null
    : null
);

// Card de seleção aberto na coluna de detalhes (imagem ou ponto do percurso).
const isMapSelectionOpen = computed(
  () =>
    collectionViewMode.value === "map" &&
    Boolean(selectedMapImage.value || selectedPathStop.value)
);

// Ponto aberto na lista e ponto sob o ponteiro na lista (destacados no mapa).
const listActiveStopNumber = ref(null);
const hoveredStopNumber = ref(null);
const pathStopsRef = ref(null);

const mapActiveStopNumber = computed(() =>
  isMapSelectionOpen.value
    ? selectedPathStop.value?.number ?? null
    : hoveredStopNumber.value ?? listActiveStopNumber.value
);

// A lista é desmontada quando o card abre (perde os pontos abertos e o
// mouseleave pode não chegar), então o destaque vindo dela é zerado.
watch(isMapSelectionOpen, () => {
  hoveredStopNumber.value = null;
  listActiveStopNumber.value = null;
});

function handleMapSelect(id) {
  selectedMapImageId.value = id;
  selectedStopNumber.value = null;

  const query = { ...route.query };

  if (id) {
    query.image = id;
  } else {
    delete query.image;
  }

  router.replace({ query });
}

// Fecha a imagem selecionada e volta às informações da coleção
// (tags, autoria, pontos do percurso), reenquadrando o mapa.
function clearMapSelection() {
  if (collectionMapRef.value) {
    collectionMapRef.value.resetToInitial();
  } else {
    handleMapSelect(null);
  }
}

// Navega para um ponto do percurso: seleciona a imagem dele no mapa ou, se ela
// não estiver no mapa, abre o card do ponto e centraliza nele.
function goToPathStop(stop) {
  if (!stop) return;

  const map = collectionMapRef.value;
  const image = stop.imageId
    ? collectionImages.value.find((img) => String(img.id) === stop.imageId)
    : null;
  if (image && map?.selectImage(image.id, { zoom: PATH_STOP_ZOOM })) return;

  map?.clearSelection();
  handleMapSelect(null);
  selectedStopNumber.value = stop.number;
  map?.focusCoordinates(stop.coordinates, { zoom: PATH_STOP_ZOOM });
}

// Ponto aberto na lista -> destaca e centraliza no mapa.
function handleStopOpen(number) {
  listActiveStopNumber.value = number;
  const stop = orderedPathStops.value[number - 1];
  collectionMapRef.value?.focusCoordinates(stop?.coordinates, { zoom: PATH_STOP_ZOOM });
}

function handleStopClose(number) {
  if (listActiveStopNumber.value === number) listActiveStopNumber.value = null;
}

// Clique numa parada no mapa: com o card aberto, navega até ela; senão abre
// o ponto na lista e centraliza nele.
function handleMapStopSelect(number) {
  const stop = orderedPathStops.value[number - 1];
  if (!stop) return;

  if (isMapSelectionOpen.value) {
    goToPathStop(stop);
    return;
  }

  listActiveStopNumber.value = number;
  pathStopsRef.value?.openStop(number);
  collectionMapRef.value?.focusCoordinates(stop.coordinates, { zoom: PATH_STOP_ZOOM });
}

// Redireciona para a página de detalhes da imagem.
function goToImageDetail(id) {
  if (!id) return;
  router.push(`/explore/dados/image/${id}`);
}

watch(collectionViewMode, (mode) => {
  if (mode !== "map") {
    // O editor de percurso só existe no mapa.
    isPathEditorOpen.value = false;
    selectedMapImageId.value = null;
    selectedStopNumber.value = null;
    listActiveStopNumber.value = null;
    // Remove a query de imagem da URL.
    if (route.query.image) {
      const query = { ...route.query };
      delete query.image;
      router.replace({ query });
    }
  }

});

const isInfoActive = ref(true);
const isGridReflowing = ref(false);
const isMobileGridExpanded = ref(false);
const galleryRef = ref(null);
const collectionMapRef = ref(null);

const MOBILE_BREAKPOINT = 768;
const isMobile = ref(
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
);

function updateIsMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
}

async function handleToggleMobileGrid() {
  const willExpand = !isMobileGridExpanded.value;
  isMobileGridExpanded.value = willExpand;

  if (!willExpand || !isMobile.value) return;

  await nextTick();

  galleryRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// Muda o modo de visualização da coleção
function handleCollectionViewChange({ selection }) {
  if (isMobile.value && selection === "mosaic") return;

  const viewMode = selectionToViewRoute(selection);

  if (viewMode === route.params.viewMode) return;

  router.push({
    name: "collection-detail",
    params: {
      collectionId: collectionId.value,
      viewMode,
    },
  });

}

function handleToggleCollectionInfo() {
  if (isMobile.value) return;

  isGridReflowing.value = true;

  window.setTimeout(() => {
    isInfoActive.value = !isInfoActive.value;
    window.setTimeout(() => {
      isGridReflowing.value = false;

    }, 220);

  }, 120);

}
/*
 * End: Toolbar
*/

/**
 * Start: Tags
 */
const collectionTags = ref([]);
const isLoadingCollectionTags = ref(true);
const COLLECTION_TAGS_VISIBLE_LIMIT = 8;
const COLLECTION_TAGS_HARD_LIMIT = 50;
const showAllCollectionTags = ref(false);

const cappedCollectionTags = computed(() =>
  collectionTags.value.slice(0, COLLECTION_TAGS_HARD_LIMIT)
);

const visibleCollectionTags = computed(() => {
  if (showAllCollectionTags.value) return cappedCollectionTags.value;
  return cappedCollectionTags.value.slice(0, COLLECTION_TAGS_VISIBLE_LIMIT);
});

const hiddenCollectionTagsCount = computed(() => {
  const remaining =
    cappedCollectionTags.value.length - COLLECTION_TAGS_VISIBLE_LIMIT;
  return remaining > 0 ? remaining : 0;
});

function toggleCollectionTagsExpanded() {
  showAllCollectionTags.value = !showAllCollectionTags.value;
}

// Normaliza as tags da coleção, preservando o id do subject (necessário para
// o filtro de busca ao clicar na tag).
function normalizeCollectionTags(tags = []) {
  return tags.map((tag) => ({ id: tag.id, term: tag.term }));
}

// Carrega as tags da coleção
async function loadCollectionTags() {
  if (!collectionId.value) {
    collectionTags.value = [];
    showAllCollectionTags.value = false;
    isLoadingCollectionTags.value = false;
    return;
  }

  isLoadingCollectionTags.value = true;
  showAllCollectionTags.value = false;

  try {
    const data = await albumsStore.getTagsByAlbumId(
      authStore.authHeader,
      collectionId.value
    );

    collectionTags.value = normalizeCollectionTags(data.tags ?? data);
  } catch (error) {
    console.error("Erro ao carregar tags da coleção:", error);
    collectionTags.value = [];
  } finally {
    isLoadingCollectionTags.value = false;
  }
}

/**
 * End: Tags
 */

/**
 * Start: Download
 */

const showDownloadModal = ref(false);
const downloadingCollection = ref(false);

// Abre o modal de download da coleção.
function handleDownloadCollection() {
  if (!collectionImages.value.length) return;
  showDownloadModal.value = true;

}

// Edita a coleção.
function handleEditCollection() {
  if (!collectionId.value) return;

  router.push({
    name: "collection-edit",
    params: {
      collectionId: collectionId.value,
    },
    query: {
      viewMode: route.params.viewMode || "grid",
    },
  });

}

// Baixa a coleção como ZIP.
async function handleCollectionDownloadConfirm() {
  downloadingCollection.value = true;

  try {
    const zipName = `${sanitizeDownloadFilename(collectionTitle.value, "coleção")}.zip`;
    await downloadCollectionAsZip(collectionImages.value, zipName);
    showDownloadModal.value = false;

  } catch (err) {
    console.error(err);

  } finally {
    downloadingCollection.value = false;

  }
}

/**
 * End: Download
 */

// "Voltar": retorna à página anterior se houver histórico interno;
// senão, cai na página do dono (coletivo/perfil) derivada do álbum.
function goBack() {
  const backPath = window.history.state?.back ?? null;
  const isBackToEdit = typeof backPath === "string" && backPath.includes("/edit");

  if (backPath && !isBackToEdit) {
    router.back();
    return;
  }

  const target = ownerProfileTo.value;
  if (target) router.push(target);
  else router.push("/");
}

const tryFetchNextPage = () => {
  if (!hasNextPage.value || isFetchingNextPage.value || isLoadingCollection.value) {
    return;
  }
  fetchNextPage();
};

const handleImagesScroll = () => {
  // Mosaico escuta o scroll no próprio componente (padrão Explore).
  if (collectionViewMode.value === "mosaic") return;

  const scrollPosition = window.innerHeight + window.scrollY;
  const pageBottom = document.documentElement.offsetHeight - 1000;

  if (scrollPosition >= pageBottom) {
    tryFetchNextPage();
  }
};

watch(
  [collectionImages, hasNextPage, isFetchingNextPage, isLoadingCollection],
  () => {
    if (isLoadingCollection.value || isFetchingNextPage.value || !hasNextPage.value) {
      return;
    }
    if (collectionImages.value.length === 0) return;
    if (collectionViewMode.value === "mosaic") return;

    const pageTooShort =
      document.documentElement.offsetHeight <= window.innerHeight + 1000;

    if (pageTooShort) {
      tryFetchNextPage();
    }
  }
);

onMounted(() => {
  fetchCollectionData();
  updateIsMobile();
  window.addEventListener("resize", updateIsMobile);
  window.addEventListener("scroll", handleImagesScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("resize", updateIsMobile);
  window.removeEventListener("scroll", handleImagesScroll);
});

watch(
  () => route.params.collectionId,
  () => {
    fetchCollectionData();
  }
);

watch(
  [isMobile, () => route.params.viewMode],
  ([mobile, viewMode]) => {
    if (!mobile || viewMode !== "mosaic" || !collectionId.value) return;

    router.replace({
      name: "collection-detail",
      params: {
        collectionId: collectionId.value,
        viewMode: "grid",
      },
    });
  },
  { immediate: true }
);

</script>

<template>
  <section
    class="collection-detail__container"
    :class="{
      'collection-detail__container--mobile': isMobile,
      'collection-detail__container--path-editing': isPathEditing,
    }"
  >
    <CollectionToolbar
      v-if="!isMobile && !accessState"
      class="collection-detail__floating-toolbar"
      :view-selection="viewSelection"
      :is-info-active="isInfoActive"
      :allowed-views="['grid', 'mosaic', 'map']"
      :can-edit="canManage"
      @view-change="handleCollectionViewChange"
      @toggle-info="handleToggleCollectionInfo"
      @download="handleDownloadCollection"
      @edit="handleEditCollection"
    />

    <DownloadModal
      v-model="showDownloadModal"
      :collection-count="collectionImages.length"
      :busy="downloadingCollection"
      @confirm="handleCollectionDownloadConfirm"
    />
    <CollectionPathModal
      v-model="showPathModal"
      :mode="pathModalMode"
      @confirm="onPathModalConfirm"
    />
    <div class="collection-detail__toast-host">
      <AppToast
        :toasts="pathToasts"
        variant="solid"
        @close="hideToast"
        @pause="pauseToast"
        @resume="resumeToast"
      />
    </div>
    <!-- Durante a edição do percurso o "voltar" some; a saída é pelo painel do mapa. -->
    <header v-if="!isPathEditing" class="collection-detail__header">
        <button
          type="button"
          class="collection-detail__back-btn"
          aria-label="Voltar"
          @click="goBack"
        >
            <span class="collection-detail__back-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M13.1248 7.00055C13.1248 6.88452 13.0787 6.77324 12.9967 6.69119C12.9146 6.60915 12.8033 6.56305 12.6873 6.56305H2.36843L5.12206 3.8103C5.16273 3.76963 5.195 3.72134 5.21701 3.66819C5.23903 3.61504 5.25036 3.55808 5.25036 3.50055C5.25036 3.44303 5.23903 3.38606 5.21701 3.33292C5.195 3.27977 5.16273 3.23148 5.12206 3.1908C5.08138 3.15013 5.03309 3.11786 4.97994 3.09584C4.92679 3.07383 4.86983 3.0625 4.81231 3.0625C4.75478 3.0625 4.69782 3.07383 4.64467 3.09584C4.59152 3.11786 4.54323 3.15013 4.50256 3.1908L1.00256 6.6908C0.961813 6.73144 0.929488 6.77972 0.907432 6.83287C0.885376 6.88603 0.874023 6.94301 0.874023 7.00055C0.874023 7.0581 0.885376 7.11508 0.907432 7.16823C0.929488 7.22138 0.961813 7.26966 1.00256 7.3103L4.50256 10.8103C4.54323 10.851 4.59152 10.8832 4.64467 10.9053C4.69782 10.9273 4.75478 10.9386 4.81231 10.9386C4.86983 10.9386 4.92679 10.9273 4.97994 10.9053C5.03309 10.8832 5.08138 10.851 5.12206 10.8103C5.16273 10.7696 5.195 10.7213 5.21701 10.6682C5.23903 10.615 5.25036 10.5581 5.25036 10.5006C5.25036 10.443 5.23903 10.3861 5.21701 10.3329C5.195 10.2798 5.16273 10.2315 5.12206 10.1908L2.36843 7.43805H12.6873C12.8033 7.43805 12.9146 7.39196 12.9967 7.30991C13.0787 7.22786 13.1248 7.11658 13.1248 7.00055Z"
                    fill="#2F2F2F"
                />
                </svg>
                <span class="collection-detail__back-text">voltar</span>
            </span>
        </button>
    </header>

    <!-- Estados de acesso (coleção privada, inexistente ou erro) -->
    <div
      v-if="accessState === 'forbidden'"
      class="collection-detail__state alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-inline-flex align-items-center px-3 py-2"
      role="status"
    >
      <i class="bi bi-lock-fill text-dark me-2"></i>
      <span>Esta coleção é privada e você não tem permissão para visualizá-la.</span>
    </div>

    <div
      v-else-if="accessState === 'notfound'"
      class="collection-detail__state alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-inline-flex align-items-center px-3 py-2"
      role="status"
    >
      <i class="bi bi-exclamation-circle-fill text-dark me-2"></i>
      <span>Coleção não encontrada.</span>
    </div>

    <div
      v-else-if="accessState === 'error'"
      class="collection-detail__state collection-detail__state--error"
      role="alert"
    >
      Não foi possível carregar a coleção. Tente novamente.
    </div>

    <main v-else class="collection-detail__main container-fluid px-0">
      <div
        class="row g-0 collection-detail__row"
        :class="{
          'collection-detail__row--mobile': isMobile,
          'collection-detail__row--grid-expanded': isMobile && isMobileGridExpanded,
          'collection-detail__row--map': collectionViewMode === 'map',
          'collection-detail__row--path-editing': isPathEditing,
        }"
      >
        <template v-if="!isMobile">
          <div class="collection-detail__image-wrapper">
            <header
              class="collection-detail__main-title-area"
              :class="{
                'collection-detail__main-title-area--visible':
                  !isInfoActive && !isLoadingCollection && !isPathEditing,
              }"
              :aria-hidden="isInfoActive || isLoadingCollection || isPathEditing"
            >
              <h1 class="collection-detail__main-title">
                {{ collectionTitle }}
              </h1>
            </header>

            <section
              class="collection-detail__gallery"
              :class="{
                'collection-detail__gallery--with-title':
                  isInfoActive && !isMobile,
                'collection-detail__gallery--map':
                  collectionViewMode === 'map',
              }"
            >
              <CollectionImagesGrid
                v-if="collectionViewMode === 'grid'"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :is-fetching-next-page="isFetchingNextPage"
                :has-next-page="hasNextPage"
                :is-grid-reflowing="isGridReflowing"
                :is-info-active="isInfoActive"
                :allow-remove="false"
                @load-more="tryFetchNextPage"
              />

              <CollectionImagesMosaic
                v-else-if="collectionViewMode === 'mosaic'"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :is-fetching-next-page="isFetchingNextPage"
                :has-next-page="hasNextPage"
                :is-info-active="isInfoActive"
                @load-more="tryFetchNextPage"
              />

              <CollectionPathMap
                v-if="isPathEditing"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :is-saving="isSavingPath"
                :initial-stops="pathInitialStops"
                :initial-route="pathInitialRoute"
                :location-warning="pathEditorLocationWarning"
                @save="onPathMapSave"
                @back="onPathMapBack"
                @alert="showPathAlert($event, 'error')"
              />
              <CollectionImagesMap
                ref="collectionMapRef"
                v-else-if="collectionViewMode === 'map'"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :initial-selected-id="selectedMapImageId"
                :route="pathInitialRoute"
                :stops="pathInitialStops"
                :active-stop-number="mapActiveStopNumber"
                @select="handleMapSelect"
                @stop-select="handleMapStopSelect"
              />
            </section>
          </div>
        </template>

        <div
          v-if="isMobile"
          class="collection-detail__mobile-stage"
        >
          <div
            id="collection-detail-mobile-gallery"
            ref="galleryRef"
            class="collection-detail__image-wrapper collection-detail__image-wrapper--mobile"
            :class="{
              'collection-detail__image-wrapper--grid-collapsed': !isMobileGridExpanded,
              'collection-detail__image-wrapper--grid-expanded': isMobileGridExpanded,
            }"
          >
            <section
              class="collection-detail__gallery"
              :class="{
                'collection-detail__gallery--map': collectionViewMode === 'map',
              }"
            >
              <CollectionImagesGrid
                v-if="collectionViewMode !== 'map'"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :is-fetching-next-page="isFetchingNextPage"
                :has-next-page="hasNextPage"
                :is-info-active="false"
                :allow-remove="false"
                @load-more="tryFetchNextPage"
              />

              <CollectionPathMap
                v-else-if="isPathEditing"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :is-saving="isSavingPath"
                :initial-stops="pathInitialStops"
                :initial-route="pathInitialRoute"
                :location-warning="pathEditorLocationWarning"
                @save="onPathMapSave"
                @back="onPathMapBack"
                @alert="showPathAlert($event, 'error')"
              />
              <CollectionImagesMap
                v-else
                ref="collectionMapRef"
                :images="collectionImages"
                :is-loading="isLoadingCollection"
                :route="pathInitialRoute"
                :stops="pathInitialStops"
                :active-stop-number="mapActiveStopNumber"
                @select="handleMapSelect"
                @stop-select="handleMapStopSelect"
              />
            </section>
          </div>

          <button
            v-if="!isPathEditing"
            type="button"
            class="collection-detail__mobile-handle"
            :aria-expanded="isMobileGridExpanded"
            aria-controls="collection-detail-mobile-gallery"
            :aria-label="
              isMobileGridExpanded
                ? 'Recolher grade de imagens'
                : 'Expandir grade de imagens'
            "
            @click="handleToggleMobileGrid"
          >
            <svg
              class="collection-detail__mobile-handle-icon"
              :class="{
                'collection-detail__mobile-handle-icon--expanded': isMobileGridExpanded,
              }"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M3.88145 16.941C4.02998 16.6453 4.28972 16.4205 4.60371 16.316C4.91771 16.2115 5.26033 16.2358 5.55645 16.3835L19.999 23.601L34.439 16.381C34.5859 16.3059 34.7462 16.2607 34.9106 16.2479C35.0751 16.2351 35.2405 16.255 35.3972 16.3064C35.554 16.3578 35.699 16.4398 35.8239 16.5475C35.9489 16.6552 36.0512 16.7866 36.1251 16.9341C36.199 17.0816 36.243 17.2423 36.2546 17.4068C36.2661 17.5714 36.2449 17.7366 36.1923 17.893C36.1396 18.0493 36.0566 18.1937 35.9479 18.3178C35.8392 18.4419 35.707 18.5432 35.559 18.616L20.559 26.116C20.3851 26.2031 20.1934 26.2484 19.999 26.2484C19.8045 26.2484 19.6128 26.2031 19.439 26.116L4.43895 18.616C4.14323 18.4674 3.91848 18.2077 3.81397 17.8937C3.70946 17.5797 3.73373 17.2371 3.88145 16.941V16.941Z"
                fill="#636262"
              />
            </svg>
          </button>
        </div>

        <div
          v-if="isMobile && !isPathEditing"
          class="collection-detail__info-slot collection-detail__info-slot--mobile"
        >
          <div
            id="collection-detail-mobile-info"
            class="collection-detail__info-wrapper collection-detail__info-wrapper--mobile"
            aria-label="Informações da coleção"
          >
            <div class="collection-detail__info-inner">
              <aside v-if="isLoadingCollection" class="collection-detail__info-summary collection-detail__space">
                <div class="collection-detail__title-skeleton" />
                <div class="collection-detail__description-skeleton" />
              </aside>
              <aside v-else class="collection-detail__info-summary collection-detail__space">
                <h1 class="collection-detail__title">{{ collectionTitle }}</h1>
                <span
                  class="collection-detail__visibility"
                  :class="isPrivate
                    ? 'collection-detail__visibility--private'
                    : 'collection-detail__visibility--public'"
                >
                  <i
                    class="bi"
                    :class="isPrivate ? 'bi-lock-fill' : 'bi-globe2'"
                    aria-hidden="true"
                  ></i>
                  {{ visibilityLabel }}
                </span>
                <UiExpandableText
                  class="collection-detail__description"
                  :text="collectionDescription"
                />
              </aside>

              <template v-if="!isMapSelectionOpen">
              <section
                class="collection-detail__tags-block collection-detail__space"
                aria-labelledby="collection-tags-heading"
              >
                <div class="collection-detail__tags-heading-row">
                  <h2 id="collection-tags-heading" class="collection-detail__tags-title">
                    Tags na coleção
                  </h2>
                  <UiField
                    id="collection-tags-help"
                    class="collection-detail__help-field"
                    label="Ajuda"
                    explain="Estas etiquetas são coletadas de cada imagem presente na coleção."
                  />
                </div>
                <div v-if="isLoadingCollectionTags" class="metadata-tags metadata-tags--skeleton">
                  <span
                    v-for="n in 5"
                    :key="`tag-skeleton-${n}`"
                    class="metadata-tags__skeleton"
                    aria-hidden="true"
                  />
                </div>
                <div v-else-if="cappedCollectionTags.length" class="metadata-tags">
                  <button
                    v-for="(tag, index) in visibleCollectionTags"
                    :key="`${tag.id}-${index}`"
                    type="button"
                    class="btn btn-outline-primary btn-sm btn-tag"
                    @click="goToSubject(tag.id)"
                  >
                    {{ tag.term }}
                  </button>
                  <button
                    v-if="hiddenCollectionTagsCount > 0"
                    type="button"
                    class="btn btn-outline-primary btn-sm btn-tag metadata-tags__more"
                    :aria-expanded="showAllCollectionTags"
                    :aria-label="
                      showAllCollectionTags
                        ? 'Mostrar menos tags'
                        : `Mostrar mais ${hiddenCollectionTagsCount} tags`
                    "
                    @click="toggleCollectionTagsExpanded"
                  >
                    {{ showAllCollectionTags ? "menos" : `+${hiddenCollectionTagsCount}` }}
                  </button>
                </div>
              </section>
              </template>

              <div
                class="collection-detail__map-panel-body"
                :class="{
                  'collection-detail__map-panel-body--map': collectionViewMode === 'map',
                  'collection-detail__map-panel-body--selected': isMapSelectionOpen,
                }"
              >
              <CollectionMapSelection
                v-if="isMapSelectionOpen"
                :image="selectedMapImage"
                :stop="selectedPathStop"
                :stop-count="orderedPathStops.length"
                :previous-stop="previousPathStop"
                :next-stop="nextPathStop"
                @back="clearMapSelection"
                @open-image="goToImageDetail"
                @go-to-stop="goToPathStop"
              />

              <template v-if="!isMapSelectionOpen">
              <section class="collection-detail__actors">
              <div class="collection-detail__actors-title-area">
                <h2 class="collection-detail__actors-title">{{ ownerTitle }}</h2>
              </div>
              <div class="collection-detail__actors-list">
                <div class="collection-detail__actor-image-area">
                  <div
                    v-if="isLoadingOwner"
                    class="collection-detail__actor-image-skeleton"
                    aria-hidden="true"
                  />
                  <img
                    v-else
                    :src="ownerAvatarSrc"
                    :alt="`Avatar de ${ownerName}`"
                    class="collection-detail__actor-image"
                  />
                </div>
                <div class="collection-detail__actor-name-wrapper">
                  <div v-if="isLoadingOwner" class="collection-detail__actor-name-skeleton" />
                  <component
                    :is="ownerProfileTo ? 'RouterLink' : 'p'"
                    v-else
                    :to="ownerProfileTo || undefined"
                    class="collection-detail__actor-name"
                    :class="{ 'collection-detail__actor-name--visible': !isLoadingOwner }"
                  >
                    {{ ownerName }}
                  </component>
                </div>
              </div>
            </section>

            <section
              v-if="showPathPublicBlock"
              class="collection-detail__path-block collection-detail__space"
              aria-labelledby="collection-path-view-heading"
            >
              <div class="collection-detail__path-heading-row">
                <h2 id="collection-path-view-heading" class="collection-detail__path-title">
                  Percurso da coleção
                </h2>
                <UiField
                  id="collection-path-view-help"
                  class="collection-detail__help-field"
                  label="Ajuda"
                  :explain="pathPublicHelp"
                />
              </div>
              <p v-if="showNoPathMessage" class="collection-detail__path-empty">
                Essa coleção não tem um percurso.
              </p>
              <div v-if="showPathViewBlock" class="collection-detail__path-actions">
                <button
                  type="button"
                  class="collection-detail__path-btn collection-detail__path-btn--primary"
                  @click="openPathView"
                >
                  <i class="bi bi-map" aria-hidden="true" />
                  Visualizar percurso
                </button>
              </div>
              <div
                v-if="locationNotice && !showPathManageBlock"
                class="collection-detail__location-notice alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-flex align-items-center mb-0"
                role="status"
              >
                <i class="bi bi-arrow-up-right-circle-fill text-dark me-3" aria-hidden="true"></i>
                <span>{{ locationNotice }}</span>
              </div>
            </section>

            <section
              v-if="showPathManageBlock"
              class="collection-detail__path-block collection-detail__space"
              aria-labelledby="collection-path-manage-heading"
            >
              <div class="collection-detail__path-heading-row">
                <h2 id="collection-path-manage-heading" class="collection-detail__path-title">
                  Percurso da coleção
                </h2>
                <UiField
                  id="collection-path-manage-help"
                  class="collection-detail__help-field"
                  label="Ajuda"
                  :explain="pathManageHelp"
                />
              </div>
              <div class="collection-detail__path-actions">
                <template v-if="isCollectionPath">
                  <button
                    type="button"
                    class="collection-detail__path-btn collection-detail__path-btn--primary"
                    :disabled="isSavingPath"
                    @click="openPathModal('edit')"
                  >
                    Editar percurso
                  </button>
                  <button
                    type="button"
                    class="collection-detail__path-btn collection-detail__path-btn--secondary"
                    :disabled="isSavingPath"
                    @click="openPathModal('delete')"
                  >
                    Apagar percurso
                  </button>
                </template>
                <button
                  v-else
                  type="button"
                  class="collection-detail__path-btn collection-detail__path-btn--primary"
                  @click="openCreatePathModal"
                >
                  <i class="bi bi-map" aria-hidden="true" />
                  Criar percurso
                </button>
              </div>
              <div
                v-if="locationNotice"
                class="collection-detail__location-notice alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-flex align-items-center mb-0"
                role="status"
              >
                <i class="bi bi-arrow-up-right-circle-fill text-dark me-3" aria-hidden="true"></i>
                <span>{{ locationNotice }}</span>
              </div>
            </section>

            <section
              v-if="showPathStops"
              class="collection-detail__stops-block"
              aria-labelledby="collection-stops-heading"
            >
              <div class="collection-detail__stops-heading-row">
                <h2 id="collection-stops-heading" class="collection-detail__stops-title">
                  Pontos do percurso
                </h2>
                <UiField
                  id="collection-stops-help"
                  class="collection-detail__help-field"
                  label="Ajuda"
                  explain="Locais que compõem o percurso, na ordem em que devem ser visitados."
                />
              </div>
              <p v-if="pathSummary" class="collection-detail__stops-summary">
                <i class="bi bi-signpost-split" aria-hidden="true"></i>
                {{ pathSummary }}
              </p>
              <CollectionPathStops
                ref="pathStopsRef"
                :stops="pathInitialStops"
                :images="collectionImages"
                :active-number="listActiveStopNumber"
                @open="handleStopOpen"
                @close="handleStopClose"
                @hover="hoveredStopNumber = $event"
              />
            </section>

            <section
              class="collection-detail__periods-block"
              aria-labelledby="collection-periods-heading"
            >
              <div class="collection-detail__periods-heading-row">
                <h2 id="collection-periods-heading" class="collection-detail__periods-title">
                  Períodos da coleção
                </h2>
                <UiField
                  id="collection-periods-help"
                  class="collection-detail__help-field"
                  label="Ajuda"
                  explain="Distribuição temporal das obras desta coleção (em construção)."
                />
              </div>
              <CollectionPeriodsChart aria-label="Gráfico de períodos da coleção" />
            </section>

            </template>
            </div>

            <div v-if="canManage" class="collection-detail__mobile-edit">
              <button
                type="button"
                class="collection-detail__mobile-edit-btn"
                @click="handleEditCollection"
              >
                <i class="bi bi-pencil-square" aria-hidden="true" />
                <span>Editar</span>
              </button>
            </div>
            </div>
          </div>
        </div>

        <div v-if="!isMobile && !isPathEditing" class="collection-detail__info-slot">
          <div
            class="collection-detail__info-wrapper"
            :class="{ 'collection-detail__info-wrapper--closed': !isInfoActive }"
            :aria-hidden="!isInfoActive"
            aria-label="Informações da coleção"
          >
            <div class="collection-detail__info-inner">
              <aside v-if="isLoadingCollection" class="collection-detail__info-summary collection-detail__space">
                <div class="collection-detail__title-skeleton" />
                <div class="collection-detail__description-skeleton" />
              </aside>
              <aside v-else class="collection-detail__info-summary collection-detail__space">
                <h1 class="collection-detail__title">{{ collectionTitle }}</h1>
                <span
                  class="collection-detail__visibility"
                  :class="isPrivate
                    ? 'collection-detail__visibility--private'
                    : 'collection-detail__visibility--public'"
                >
                  <i
                    class="bi"
                    :class="isPrivate ? 'bi-lock-fill' : 'bi-globe2'"
                    aria-hidden="true"
                  ></i>
                  {{ visibilityLabel }}
                </span>
                <UiExpandableText
                  class="collection-detail__description"
                  :text="collectionDescription"
                />
              </aside>

              <template v-if="!isMapSelectionOpen">
              <section
                class="collection-detail__tags-block collection-detail__space"
                aria-labelledby="collection-tags-heading-desktop"
              >
                <div class="collection-detail__tags-heading-row">
                  <h2 id="collection-tags-heading-desktop" class="collection-detail__tags-title">
                    Tags na coleção
                  </h2>
                  <UiField
                    id="collection-tags-help-desktop"
                    class="collection-detail__help-field"
                    label="Ajuda"
                    explain="Estas etiquetas são coletadas de cada imagem presente na coleção."
                  />
                </div>
                <div v-if="isLoadingCollectionTags" class="metadata-tags metadata-tags--skeleton">
                  <span
                    v-for="n in 5"
                    :key="`tag-skeleton-desktop-${n}`"
                    class="metadata-tags__skeleton"
                    aria-hidden="true"
                  />
                </div>
                <div v-else-if="cappedCollectionTags.length" class="metadata-tags">
                  <button
                    v-for="(tag, index) in visibleCollectionTags"
                    :key="`desktop-${tag.id}-${index}`"
                    type="button"
                    class="btn btn-outline-primary btn-sm btn-tag"
                    @click="goToSubject(tag.id)"
                  >
                    {{ tag.term }}
                  </button>
                  <button
                    v-if="hiddenCollectionTagsCount > 0"
                    type="button"
                    class="btn btn-outline-primary btn-sm btn-tag metadata-tags__more"
                    :aria-expanded="showAllCollectionTags"
                    :aria-label="
                      showAllCollectionTags
                        ? 'Mostrar menos tags'
                        : `Mostrar mais ${hiddenCollectionTagsCount} tags`
                    "
                    @click="toggleCollectionTagsExpanded"
                  >
                    {{ showAllCollectionTags ? "menos" : `+${hiddenCollectionTagsCount}` }}
                  </button>
                </div>
              </section>
              </template>

              <div
                class="collection-detail__map-panel-body"
                :class="{
                  'collection-detail__map-panel-body--map': collectionViewMode === 'map',
                  'collection-detail__map-panel-body--selected': isMapSelectionOpen,
                }"
              >
              <CollectionMapSelection
                v-if="isMapSelectionOpen"
                :image="selectedMapImage"
                :stop="selectedPathStop"
                :stop-count="orderedPathStops.length"
                :previous-stop="previousPathStop"
                :next-stop="nextPathStop"
                @back="clearMapSelection"
                @open-image="goToImageDetail"
                @go-to-stop="goToPathStop"
              />

              <template v-if="!isMapSelectionOpen">
              <section class="collection-detail__actors collection-detail__space">
                <div class="collection-detail__actors-title-area">
                  <h2 class="collection-detail__actors-title">{{ ownerTitle }}</h2>
                </div>
                <div class="collection-detail__actors-list">
                  <div class="collection-detail__actor-image-area">
                    <div
                      v-if="isLoadingOwner"
                      class="collection-detail__actor-image-skeleton"
                      aria-hidden="true"
                    />
                    <img
                      v-else
                      :src="ownerAvatarSrc"
                      :alt="`Avatar de ${ownerName}`"
                      class="collection-detail__actor-image"
                    />
                  </div>
                  <div class="collection-detail__actor-name-wrapper">
                    <div v-if="isLoadingOwner" class="collection-detail__actor-name-skeleton" />
                    <component
                      :is="ownerProfileTo ? 'RouterLink' : 'p'"
                      v-else
                      :to="ownerProfileTo || undefined"
                      class="collection-detail__actor-name"
                      :class="{ 'collection-detail__actor-name--visible': !isLoadingOwner }"
                    >
                      {{ ownerName }}
                    </component>
                  </div>
                </div>
              </section>

              <section
                v-if="showPathPublicBlock"
                class="collection-detail__path-block collection-detail__space"
                aria-labelledby="collection-path-view-heading-desktop"
              >
                <div class="collection-detail__path-heading-row">
                  <h2 id="collection-path-view-heading-desktop" class="collection-detail__path-title">
                    Percurso da coleção
                  </h2>
                  <UiField
                    id="collection-path-view-help-desktop"
                    class="collection-detail__help-field"
                    label="Ajuda"
                    :explain="pathPublicHelp"
                  />
                </div>
                <p v-if="showNoPathMessage" class="collection-detail__path-empty">
                  Essa coleção não tem um percurso.
                </p>
                <div v-if="showPathViewBlock" class="collection-detail__path-actions">
                  <button
                    type="button"
                    class="collection-detail__path-btn collection-detail__path-btn--primary"
                    @click="openPathView"
                  >
                    <i class="bi bi-map" aria-hidden="true" />
                    Visualizar percurso
                  </button>
                </div>
                <div
                  v-if="locationNotice && !showPathManageBlock"
                  class="collection-detail__location-notice alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-flex align-items-center mb-0"
                  role="status"
                >
                  <i class="bi bi-arrow-up-right-circle-fill text-dark me-3" aria-hidden="true"></i>
                  <span>{{ locationNotice }}</span>
                </div>
              </section>

              <section
                v-if="showPathManageBlock"
                class="collection-detail__path-block collection-detail__space"
                aria-labelledby="collection-path-manage-heading-desktop"
              >
                <div class="collection-detail__path-heading-row">
                  <h2 id="collection-path-manage-heading-desktop" class="collection-detail__path-title">
                    Percurso da coleção
                  </h2>
                  <UiField
                    id="collection-path-manage-help-desktop"
                    class="collection-detail__help-field"
                    label="Ajuda"
                    :explain="pathManageHelp"
                  />
                </div>
                <div class="collection-detail__path-actions">
                  <template v-if="isCollectionPath">
                    <button
                      type="button"
                      class="collection-detail__path-btn collection-detail__path-btn--primary"
                      :disabled="isSavingPath"
                      @click="openPathModal('edit')"
                    >
                      Editar percurso
                    </button>
                    <button
                      type="button"
                      class="collection-detail__path-btn collection-detail__path-btn--secondary"
                      :disabled="isSavingPath"
                      @click="openPathModal('delete')"
                    >
                      Apagar percurso
                    </button>
                  </template>
                  <button
                    v-else
                    type="button"
                    class="collection-detail__path-btn collection-detail__path-btn--primary"
                    @click="openCreatePathModal"
                  >
                    <i class="bi bi-map" aria-hidden="true" />
                    Criar percurso
                  </button>
                </div>
                <div
                  v-if="locationNotice"
                  class="collection-detail__location-notice alert alert-dark bg-off-white alert-light border border-dark border-start-3 d-flex align-items-center mb-0"
                  role="status"
                >
                  <i class="bi bi-arrow-up-right-circle-fill text-dark me-3" aria-hidden="true"></i>
                  <span>{{ locationNotice }}</span>
                </div>
              </section>

              <section
                v-if="showPathStops"
                class="collection-detail__stops-block"
                aria-labelledby="collection-stops-heading-desktop"
              >
                <div class="collection-detail__stops-heading-row">
                  <h2 id="collection-stops-heading-desktop" class="collection-detail__stops-title">
                    Pontos do percurso
                  </h2>
                  <UiField
                    id="collection-stops-help-desktop"
                    class="collection-detail__help-field"
                    label="Ajuda"
                    explain="Locais que compõem o percurso, na ordem em que devem ser visitados."
                  />
                </div>
                <p v-if="pathSummary" class="collection-detail__stops-summary">
                  <i class="bi bi-signpost-split" aria-hidden="true"></i>
                  {{ pathSummary }}
                </p>
                <CollectionPathStops
                  ref="pathStopsRef"
                  :stops="pathInitialStops"
                  :images="collectionImages"
                  :active-number="listActiveStopNumber"
                  @open="handleStopOpen"
                  @close="handleStopClose"
                  @hover="hoveredStopNumber = $event"
                />
              </section>

              <section
                class="collection-detail__periods-block"
                aria-labelledby="collection-periods-heading-desktop"
              >
                <div class="collection-detail__periods-heading-row">
                  <h2 id="collection-periods-heading-desktop" class="collection-detail__periods-title">
                    Períodos da coleção
                  </h2>
                  <UiField
                    id="collection-periods-help-desktop"
                    class="collection-detail__help-field"
                    label="Ajuda"
                    explain="Distribuição temporal das obras desta coleção (em construção)."
                  />
                </div>
                <CollectionPeriodsChart aria-label="Gráfico de períodos da coleção" />
              </section>

              </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </section>
</template>

<style lang="scss" scoped>

.collection-detail__image-wrapper {
  flex: 1 1 0;
  min-width: 0;
  transition: flex-basis 350ms ease;
}

.collection-detail__actors {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__actors-title-area {
  // display: flex;
  // align-items: center;
  // gap: 12px;
  // align-self: stretch;
}

.collection-detail__actors-title {
  flex: 1 0 0;
  color: var(--Preto);
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  margin: 0;
}

.collection-detail__actors-list {
  display: flex;
  align-items: center;
  gap: 16px;
  align-self: stretch;
}

.collection-detail__actor-image-area {
  display: flex;
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1/1;  
  background-color: var(--Cinza_C, #A6A6A6);
  border-radius: 50%;
}

.collection-detail__actor-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  opacity: 0;
  animation: actorFadeIn 220ms ease forwards;
}

@keyframes actorFadeIn {
  to {
    opacity: 1;
  }
}

.collection-detail__actor-image-skeleton {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e8e8e8;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

.collection-detail__actor-name {
  color: var(--Preto);
  
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  margin: 0;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 220ms ease, transform 220ms ease;  
}

.collection-detail__actor-name--visible {
  opacity: 1;
  transform: translateY(0);
}

/* Quando o nome do dono é um link (RouterLink → <a>), mantém a mesma aparência
   do texto e indica que é clicável. */
a.collection-detail__actor-name {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

a.collection-detail__actor-name:hover {
  text-decoration: underline;
}

.collection-detail__state {
  margin-top: 8px;
}

.collection-detail__state--error {
  color: #7a1c1c;
  
  font-size: 14px;
}

.collection-detail__container {
  width: 100%;
  min-height: 0;
  padding: 26px 52px 0;
  display: flex;
  flex-direction: column;
}

.collection-detail__main {
  width: 100%;
  margin-top: 16px;
  flex: 0 0 auto;
}

.collection-detail__header {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.collection-detail__back-btn {
  display: inline-flex;
  padding: 4px 14px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E);
  background: var(--Off_white,);
  cursor: pointer;
}

.collection-detail__back-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.collection-detail__back-text {
  color: var(--Cinza_E);
  
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
}

.collection-detail__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
}

.collection-detail__gallery {
  width: 100%;
  min-height: 320px;
  border-radius: 8px;
  background: #fff;
  transition:
    transform 320ms ease,
    opacity 260ms ease;
}

.collection-detail__gallery--map {
  display: flex;
  flex-direction: column;
  min-height: 620px;
  height: 75vh;
}

.collection-detail__gallery--map > * {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.collection-detail__row--map {
  align-items: stretch;
}

/* Edição de percurso: mapa em largura total, sem painel de detalhes. */
.collection-detail__row--path-editing {
  gap: 0;
}

.collection-detail__row--path-editing .collection-detail__image-wrapper {
  flex: 1 1 100%;
  width: 100%;
  max-width: 100%;
}

/* Sem padding/margem: o mapa encosta nas bordas da tela. A especificidade
   dupla vence também o padding do container no breakpoint mobile. */
.collection-detail__container.collection-detail__container--path-editing {
  padding: 0;
}

.collection-detail__container--path-editing .collection-detail__main {
  margin-top: 0;
}

.collection-detail__container--path-editing .collection-detail__gallery {
  border-radius: 0;
}

.collection-detail__row--map:not(.collection-detail__row--mobile) .collection-detail__info-inner {
  min-height: 620px;
}

.collection-detail__map-panel-body--map {
  min-height: 560px;
  flex-shrink: 0;
}

.collection-detail__map-panel-body--selected {
  min-height: 0;
}

.collection-detail__gallery--with-title {
  transform: translateY(0);
}

.collection-detail__main-title-area {
  width: 100%;
  max-height: 0;
  padding: 0;
  opacity: 0;
  transform: translateY(-8px);
  overflow: hidden;
  pointer-events: none;
  transition:
    max-height 360ms cubic-bezier(0.22, 1, 0.36, 1),
    padding 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: max-height, padding, opacity, transform;
}

.collection-detail__main-title-area--visible {
  max-height: 96px;
  padding: 24px 0 16px;
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.collection-detail__main-title {
  margin: 0;
  color: var(--Cinza_E);
  
  font-size: 30px;
  font-weight: 500;
  line-height: 115%;
}

.collection-detail__info-slot {
  display: flex;
  flex: 0 0 380px;
  width: 380px;
  max-width: 380px;
  min-width: 280px;
  height: auto;
  max-height: 100vh;
  align-self: flex-start;
  position: sticky;
  top: 0;
  box-sizing: border-box;
  transition:
    flex-basis 360ms cubic-bezier(0.22, 1, 0.36, 1),
    width 360ms cubic-bezier(0.22, 1, 0.36, 1),
    max-width 360ms cubic-bezier(0.22, 1, 0.36, 1),
    min-width 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.collection-detail__info-slot:has(.collection-detail__info-wrapper--closed) {
  flex: 0 0 0;
  width: 0;
  max-width: 0;
  min-width: 0;
  overflow: hidden;
}

.collection-detail__info-wrapper {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  max-height: 100vh;
  align-self: stretch;
  box-sizing: border-box;
  overflow: hidden;
}

.collection-detail__info-wrapper--closed:not(.collection-detail__info-wrapper--mobile) {
  flex: 0 0 0 !important;
  width: 0 !important;
  max-width: 0 !important;
  min-width: 0 !important;
  pointer-events: none;
}

.collection-detail__info-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  flex-shrink: 0;
  max-height: 100vh;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  opacity: 1;
  transform: translateX(0);
  will-change: transform, opacity;
  transition:
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 160ms ease 260ms;
  
  &::-webkit-scrollbar {
    width: 4px; /* Largura bem fina */
  }

  &::-webkit-scrollbar-track {
    background: transparent; /* Fundo do trilho transparente */
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc; /* Cor da barra */
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #999; /* Cor ao passar o mouse */
  }
}

.collection-detail__info-wrapper--closed:not(.collection-detail__info-wrapper--mobile)
  .collection-detail__info-inner {
  opacity: 0;
  transform: translateX(100%);
  transition:
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 100ms ease;
}

.collection-detail__info-summary {
  display: flex;
  width: 100%;
  padding: 0 12px;
  flex-direction: column;
  align-items: flex-start;
}

.collection-detail__title {
  align-self: stretch;
  color: var(--Cinza_E);
  
  font-size: 30px;
  font-style: normal;
  font-weight: 500;
  line-height: 115%; /* 34.5px */
}

.collection-detail__description {
  flex: 1 0 0;
  color: var(--Preto);
  
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 125%; /* 17.5px */
  padding-block: 8px;
}

/* Selo de visibilidade (pública/privada), entre o título e a descrição */
.collection-detail__visibility {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  margin-top: 6px;
  margin-bottom: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.collection-detail__visibility i {
  font-size: 12px;
  line-height: 1;
}

.collection-detail__visibility--private {
  color: var(--Laranja_E);
  background: var(--Laranja_C);
}

.collection-detail__visibility--public {
  color: var(--Cinza_E);
  background: rgba(47, 47, 47, 0.08);
}

.collection-detail__actor-name-skeleton {
  width: 140px;
  height: 22px;
  border-radius: 6px;
  background: #ececec;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

@keyframes skeletonPulse {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 767px) {
  .collection-detail__container {
    min-height: auto;
    padding: 16px;
    display: block;
    overflow-x: clip;
    max-width: 100%;
    box-sizing: border-box;
  }

  .collection-detail__container--mobile .collection-detail__main {
    margin-top: 12px;
    overflow-x: clip;
    height: auto;
    max-width: 100%;
  }

  .collection-detail__row--mobile {
    flex-direction: column;
    gap: 0;
    margin-left: 0;
    margin-right: 0;
    overflow-x: clip;
    max-width: 100%;
    min-height: 100dvh;
  }

  .collection-detail__row--mobile:not(.collection-detail__row--grid-expanded) {
    min-height: 100dvh;
  }

  .collection-detail__info-slot--mobile {
    position: relative;
    flex: 0 0 auto;
    width: 100%;
    max-width: 100%;
    background: var(--Off_white);
  }

  .collection-detail__mobile-stage {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
  }

  .collection-detail__row--mobile:not(.collection-detail__row--grid-expanded)
    .collection-detail__mobile-stage {
    flex: 1 1 auto;
    justify-content: center;
    min-height: 48dvh;
  }

  .collection-detail__row--grid-expanded {
    min-height: auto;
  }

  .collection-detail__row--grid-expanded .collection-detail__mobile-stage {
    flex: none;
    justify-content: flex-start;
    min-height: 0;
  }

  .collection-detail__row--grid-expanded .collection-detail__info-slot--mobile {
    flex: none;
  }

  .collection-detail__mobile-handle {
    flex: 0 0 auto;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    gap: 8px;
    padding: 12px 0;
    margin: 0;
    border: none;
    background: #fff;
    cursor: pointer;
  }

  .collection-detail__mobile-handle-icon {
    display: flex;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    transform: rotate(0deg);
    transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .collection-detail__mobile-handle-icon--expanded {
    transform: rotate(180deg);
  }

  .collection-detail__image-wrapper--mobile {
    flex: 0 1 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
    transition: max-height 400ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .collection-detail__image-wrapper--mobile .collection-detail__gallery {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: visible;
    height: auto;
  }

  .collection-detail__image-wrapper--grid-collapsed {
    max-height: 38dvh;
  }

  .collection-detail__image-wrapper--mobile.collection-detail__image-wrapper--grid-collapsed:has(
      .collection-detail__gallery--map
    ) {
    max-height: 70dvh;
  }

  .collection-detail__image-wrapper--grid-expanded {
    max-height: none;
    overflow: visible;
    flex: none;
  }

  .collection-detail__info-wrapper--mobile {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    overflow: visible;
    background: #fff;
  }

  .collection-detail__info-wrapper--mobile .collection-detail__info-inner {
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    opacity: 1;
    transform: none;
    overflow: visible;
  }

  .collection-detail__container--mobile .collection-detail__title {
    font-size: 24px;
  }

  .collection-detail__info-slot--mobile,
  .collection-detail__info-wrapper--mobile,
  .collection-detail__info-summary,
  .collection-detail__tags-block,
  .collection-detail__periods-block,
  .collection-detail__path-block,
  .collection-detail__stops-block,
  .collection-detail__actors {
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .metadata-tags {
    max-width: 100%;
  }

  .collection-detail__mobile-edit {
    width: 100%;
    padding: 24px 0;
    box-sizing: border-box;
  }

  .collection-detail__mobile-edit-btn {
    display: inline-flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: var(--control-height-mobile, 48px);
    min-height: var(--control-height-mobile, 48px);
    padding: 2px 14px;
    border: none;
    border-radius: 5px;
    background: var(--Laranja_E);
    color: var(--Branco, #fff);
    
    font-size: 14px;
    font-weight: 400;
    line-height: 150%;
    cursor: pointer;
    box-sizing: border-box;
  }

  .collection-detail__mobile-edit-btn i {
    font-size: 16px;
    line-height: 1;
  }
}

@media (min-width: 768px) {
  .collection-detail__mobile-handle {
    display: none;
  }
}

.collection-detail__tags-block {
  display: flex;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--p, 8px);
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__tags-heading-row {
  display: flex;
  padding-right: 13px;
  align-items: center;
  gap: 12px;
  align-self: stretch;
}

.collection-detail__tags-title {
  margin: 0;
  flex: 1 0 0;
  color: var(--Preto);
  
  font-size: 20px;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__help-field {
  width: auto;
}

.collection-detail__help-field :deep(.form-label) {
  display: none;
}

.collection-detail__help-field :deep(.mb-1) {
  margin-bottom: 0 !important;
}

.collection-detail__help-field :deep([data-cy="explain-icon"]) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.collection-detail__help-field :deep([data-cy="explain-icon"] svg) {
  width: 12px;
  height: 12px;
}

.metadata-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 395px;
}

.metadata-tags--skeleton {
  width: 100%;
}

.metadata-tags__skeleton {
  display: inline-flex;
  width: 72px;
  height: 34px;
  border-radius: 2px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: collectionTagsSkeletonShimmer 1.5s infinite;
}

.metadata-tags__skeleton:nth-child(2) {
  width: 96px;
}

.metadata-tags__skeleton:nth-child(3) {
  width: 82px;
}

.metadata-tags__skeleton:nth-child(4) {
  width: 110px;
}

.metadata-tags__skeleton:nth-child(5) {
  width: 68px;
}

@keyframes collectionTagsSkeletonShimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.metadata-tags .btn-tag {
  height: 34px;
  padding: 4px 8px;
  align-items: center;
  gap: 9px;
  display: flex;
  border-radius: 2px;
  border: 1px solid var(--Laranja_E);
  
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
  cursor: pointer;
}

.metadata-tags__more {
  font-weight: 500;
}

.collection-detail__space {
  margin-bottom: 24px;
}

/* Aviso de imagens sem localização, dentro do bloco "Percurso da coleção". */
.collection-detail__location-notice {
  align-self: stretch;
  font-size: 16px;
  line-height: 150%;
}

/* "Essa coleção não tem um percurso." */
.collection-detail__path-empty {
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-size: 16px;
  line-height: 150%;
}

.collection-detail__periods-block {
  display: flex;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__periods-heading-row {
  display: flex;
  padding: var(--g, 24px) var(--p, 12px) 8px 0;
  align-items: center;
  gap: 12px;
  align-self: stretch;
}

.collection-detail__periods-title {
  flex: 1 0 0;
  color: var(--Preto);
  
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__path-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  max-width: 600px;
  padding: 0 12px;
}

.collection-detail__path-heading-row {
  display: flex;
  padding-right: 13px;
  align-items: center;
  gap: 12px;
  align-self: stretch;
}

.collection-detail__path-title {
  flex: 1 0 0;
  margin: 0;
  color: var(--Preto);
  
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__path-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  align-self: stretch;
}

.collection-detail__path-btn {
  display: inline-flex;
  width: 100%;
  min-height: 38px;
  padding: 8.5px 14px;
  align-items: center;
  justify-content: center;
  border: none;
  gap: 6px;
  margin: 0;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 400;
  line-height: 150%;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.collection-detail__path-btn--primary {
  background: var(--Cinza_E);
  color: var(--Branco);
}

.collection-detail__path-btn--secondary {
  background: var(--Off_white);
  color: var(--Cinza_E);
}

.collection-detail__path-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.collection-detail__path-btn:focus-visible {
  outline: 2px solid var(--Cinza_E);
  outline-offset: 2px;
}

/* Pontos do percurso */
.collection-detail__stops-block {
  display: flex;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__stops-heading-row {
  display: flex;
  padding: 24px 12px 16px 0;
  align-items: center;
  gap: 12px;
  align-self: stretch;
}

.collection-detail__stops-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -8px 0 16px;
  color: var(--Cinza_M);
  font-size: 14px;
  line-height: 150%;
}

.collection-detail__stops-title {
  flex: 1 0 0;
  margin: 0;
  color: var(--Preto);
  
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__toast-host {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  max-width: calc(100vw - 32px);
  pointer-events: none;
}

.collection-detail__toast-host :deep(.app-toast) {
  pointer-events: auto;
}

.collection-detail__path-error {
  margin: 8px 0 0;
  color: #aa4f28;
  
  font-size: 13px;
}

.collection-detail__floating-toolbar {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 100;
}

@media (max-width: 767px) {
  .collection-detail__floating-toolbar {
    display: none;
  }
}

.collection-detail__title-skeleton {
  width: 80%;
  height: 34px;
  border-radius: 6px;
  background: #ececec;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

.collection-detail__description-skeleton {
  width: 100%;
  height: 72px;
  margin-top: 12px;
  border-radius: 6px;
  background: #ececec;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

</style>