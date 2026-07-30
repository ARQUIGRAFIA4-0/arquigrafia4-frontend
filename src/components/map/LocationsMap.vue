<script setup>
import { computed, markRaw, onUnmounted, ref, shallowRef, watch } from "vue";
import { LngLatBounds, Popup } from "maplibre-gl";

import MapLibreMap from "@/components/map/MapLibreMap.vue";
import { createCollectionImagesFeatureCollection } from "@/helpers/geojson.js";
import escapeHtml from "@/helpers/escapeHtml";

defineOptions({ name: "LocationsMap" });

const props = defineProps({
  images: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },

  /** 'collection' | 'explore' */
  context: { type: String, default: "collection" },

  /** Inclinação do mapa em graus (0 = 2D, 60 = 3D). */
  pitch: { type: Number, default: 0 },

  /** Busca os detalhes de uma imagem ao abrir o popup. */
  loadImageDetails: {
    type: Function,
    default: null,
  },

  /** Id da imagem a ser selecionada/focada ao carregar (restauração). */
  initialSelectedId: { type: String, default: null },
});

const emit = defineEmits(["select"]);

const mapInstance = shallowRef(null);
const selectedId = ref(null);
let activePopup = null;
let initialView = null;

const isAwayFromInitial = ref(false);

let baselineCenter = null; // [lng, lat]
let baselineZoom = null;

// Qualquer alteração mínima de zoom/centro já exibe o botão.
const VIEW_ZOOM_EPSILON = 0.01;
const VIEW_CENTER_EPSILON = 0.00005;

const captureBaselineView = () => {
  const map = mapInstance.value;
  if (!map) return;

  const center = map.getCenter();
  baselineCenter = [center.lng, center.lat];
  baselineZoom = map.getZoom();
  isAwayFromInitial.value = false;
};

const updateAwayFromInitial = () => {
  const map = mapInstance.value;
  if (!map || baselineZoom == null || !baselineCenter) {
    isAwayFromInitial.value = false;
    return;
  }

  const center = map.getCenter();
  const zoomDiff = Math.abs(map.getZoom() - baselineZoom);
  const centerDiff = Math.hypot(
    center.lng - baselineCenter[0],
    center.lat - baselineCenter[1]
  );

  isAwayFromInitial.value =
    zoomDiff > VIEW_ZOOM_EPSILON || centerDiff > VIEW_CENTER_EPSILON;
};

let activeCardPopup = null;
let activeCardImageId = null;
let isUnmounting = false;

// Guarda o centro e as folhas atualmente "abertas" para poder re-renderizar/colapsar.
let spiderContext = null;

const emptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

const styleUrl = "https://tiles.openfreemap.org/styles/positron";
const sourceId = "locations-images";
const iconId = "locations-camera-icon";
const selectedIconId = "locations-camera-icon-active";

const workIconId = "locations-work-icon";
const workSelectedIconId = "locations-work-icon-active";

const clusterLayerId = `${sourceId}-clusters`;
const clusterCountLayerId = `${sourceId}-cluster-count`;
const unclusteredLayerId = `${sourceId}-unclustered`;

// Spiderfy: hastes (linhas) e folhas (câmeras espalhadas)
const spiderLegsSourceId = `${sourceId}-spider-legs`;
const spiderLeavesSourceId = `${sourceId}-spider-leaves`;
const spiderLegsLayerId = `${sourceId}-spider-legs`;
const spiderLeavesLayerId = `${sourceId}-spider-leaves`;

const baseColor = "#2F2F2F";
const selectedColor = "#D27D30";

const DEFAULT_CENTER = [-46.6333, -23.5505];
const DEFAULT_ZOOM = 3;
const SELECTED_ICON_ZOOM = 8;
const SELECTED_ICON_ANIMATION_MS = 700;
const POPUP_CLOSE_ZOOM_DELTA = 0.1;

const cameraIconSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${fill}"/><g transform="translate(8 8) scale(0.75) translate(-8 -8)"><path fill="#FFFFFF" d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path fill="#FFFFFF" d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4Zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/></g></svg>`;

const workIconSvg = (fill = baseColor) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${fill}"/><path fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" d="M18 45 V31.5 L28 19.5 L46.5 28.5 V45 H18 Z"/><line x1="28" y1="19.5" x2="28" y2="45" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><g fill="#FFFFFF"><rect x="21" y="33" width="3.4" height="3.4" rx="0.35"/><rect x="21" y="38.2" width="3.4" height="3.4" rx="0.35"/><rect x="31" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="24.8" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="29" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="33.2" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="37.4" width="3.2" height="3.2" rx="0.3"/><rect x="31" y="41.6" width="3.2" height="3.2" rx="0.3"/><rect x="35.6" y="41.6" width="3.2" height="3.2" rx="0.3"/><rect x="40.2" y="41.6" width="3.2" height="3.2" rx="0.3"/></g></svg>`;

// image → câmera | work → prédio | selected → laranja
const iconImageLayout = [
  "case",
  ["all", ["==", ["get", "featureType"], "work"], ["get", "selected"]],
  workSelectedIconId,
  ["==", ["get", "featureType"], "work"],
  workIconId,
  ["get", "selected"],
  selectedIconId,
  iconId,
];

/* ------------------------------- Validação ---------------------------------- */
// Verifica se as coordenadas são válidas.
const isValidCoordinate = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length >= 2 &&
  Number.isFinite(coordinates[0]) &&
  Number.isFinite(coordinates[1]);

// Obtém as features localizadas.
const getLocatedFeatures = () =>
  createCollectionImagesFeatureCollection(props.images).features.filter((feature) =>
    isValidCoordinate(feature.geometry?.coordinates)
  );

// Mensagem de placeholder quando não há imagens localizadas.
const emptyMessage = computed(() =>
  props.context === "explore"
    ? "Nenhuma imagem com localização no acervo."
    : "Nenhuma imagem com localização nesta coleção."
);

// FeatureCollection com a flag selected por feature (usada no clustering e nos ícones).
const geoJsonData = computed(() => {
  const base = createCollectionImagesFeatureCollection(props.images);
  return {
    type: "FeatureCollection",
    features: base.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        selected: feature.properties?.id === selectedId.value,
      },
    })),
  };
});

// Verifica se há imagens localizadas.
const hasLocatedImages = computed(() => geoJsonData.value.features.length > 0);

// Obtém as opções iniciais do mapa.
const initialMapOptions = computed(() => {
  const features = getLocatedFeatures();
  return {
    center: features[0]?.geometry?.coordinates ?? DEFAULT_CENTER,
    zoom: features.length === 1 ? 14 : DEFAULT_ZOOM,
    pitch: props.pitch,
  };
});

const applyMapPitch = (pitch = 0) => {
  const map = mapInstance.value;
  if (!map) return;

  map.easeTo({ pitch, duration: 500 });
};

/* ----------------------- HOVER: miniatura circular ----------------------- */
// Cria o conteúdo HTML do popup circular com a miniatura da imagem.
const createCircularPopupContent = ({ thumbUrl, title }) => {
  const resolvedThumb =
    typeof thumbUrl === "string" && thumbUrl.trim().length > 0
      ? thumbUrl.trim()
      : "";
  const safeTitle = escapeHtml(title || "Imagem");

  return `
    <article class="locations-map-popup" aria-label="${safeTitle}">
      <div class="locations-map-popup__thumb">
        ${
          resolvedThumb
            ? `<img src="${escapeHtml(resolvedThumb)}" alt="" loading="lazy" />`
            : ""
        }
      </div>
    </article>
  `;

};

// Fecha o popup circular exibido no hover.
const closeActivePopup = () => {
  if (!activePopup) return;

  activePopup.remove();
  activePopup = null;
};

// Fecha o popup com o card da imagem.
const closeActiveCardPopup = () => {
  if (!activeCardPopup) return;

  activeCardPopup.remove();
  activeCardPopup = null;
  activeCardImageId = null;
};

const formatPopupDate = (dates = []) => {
  if (!Array.isArray(dates) || dates.length === 0) return "";

  const dateInfo =
    dates.find((item) => item?.type === "creation") ?? dates[0];

  if (!dateInfo) return "";

  const earliest = dateInfo.earliest_date
    ? new Date(dateInfo.earliest_date).getUTCFullYear()
    : null;

  const latest = dateInfo.latest_date
    ? new Date(dateInfo.latest_date).getUTCFullYear()
    : null;

  if (!earliest) return "";

  const circa =
    dateInfo.circa_earliest_date || dateInfo.circa_latest_date;

  const prefix = circa ? "c." : "";

  if (!latest || earliest === latest) {
    return `${prefix}${earliest}`;
  }

  return `${prefix}${earliest}-${latest}`;

};

const createExploreCardPopupContent = ({
  id,
  title,
  imageUrl,
  date = "",
  featureType = "image",
}) => {
  const safeId = encodeURIComponent(id);
  const safeTitle = escapeHtml(title || "Imagem sem título");
  const safeImageUrl = typeof imageUrl === "string" ? escapeHtml(imageUrl) : "";
  const isWork = featureType === "work";
  const href = isWork ? `/obras/${safeId}` : `/explore/dados/image/${safeId}`;
  const ctaLabel = isWork ? "Ver obra" : "Ver imagem";
  const ctaAria = isWork ? `Ver detalhes da obra ${safeTitle}` : `Ver detalhes da imagem ${safeTitle}`;

  return `
    <article class="locations-map-card">
      <div class="locations-map-card__media">
        ${
          safeImageUrl ? `<img src="${safeImageUrl}" alt="${safeTitle}" loading="lazy" />` : ""
        }
      </div>

      <div class="locations-map-card__content">
        <h3 class="locations-map-card__title" title="${safeTitle}">
          ${safeTitle}
        </h3>

        ${
          date ? `<p class="locations-map-card__date">${escapeHtml(date)}</p>` : ""
        }

        <a
          class="locations-map-card__button"
          href="${href}"
          aria-label="${ctaAria}"
        >
          <span>${ctaLabel}</span>

          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </a>
      </div>
    </article>
  `;
  
};

const showExploreCardPopup = async (feature) => {
  const map = mapInstance.value;
  const coordinates = feature?.geometry?.coordinates?.slice();
  const properties = feature?.properties ?? {};
  const id = properties.id;

  if (!map || !id || !isValidCoordinate(coordinates)) return;

  closeActivePopup();
  closeActiveCardPopup();

  const popup = new Popup({
    anchor: "bottom",
    offset: [0, -14],
    closeButton: true,
    closeOnClick: true,
    closeOnMove: false,
    className: "locations-map-card-popup-container",
  })
    .setLngLat(coordinates)
    .setHTML(
      createExploreCardPopupContent({
        id,
        title: properties.title,
        imageUrl: properties.thumbUrl ?? properties.imageUrl,
        featureType: properties.featureType ?? "image",
      })
    )
    .addTo(map);

  activeCardPopup = popup;
  activeCardImageId = id;

  const initialZoom = map.getZoom();

  const handlePopupZoomEnd = () => {
    const zoomDelta = initialZoom - map.getZoom();

    if (zoomDelta >= POPUP_CLOSE_ZOOM_DELTA) {
      popup.remove();
    }
  };

  map.on("zoomend", handlePopupZoomEnd);

  popup.on("close", () => {
    map.off("zoomend", handlePopupZoomEnd);

    if (activeCardPopup === popup) {
      activeCardPopup = null;
      activeCardImageId = null;
    }

    if (props.context === "explore" && selectedId.value === id) {
      selectedId.value = null;

      if (!isUnmounting) {
        emit("select", null);
      }
    }
  });

  // Obras não usam /api/images/:id — o GeoJSON já traz título/thumb.
  if (!props.loadImageDetails || properties.featureType === "work") return;

  try {
    const details = await props.loadImageDetails(id);

    if (activeCardPopup !== popup || activeCardImageId !== id) return;

    popup.setHTML(
      createExploreCardPopupContent({
        id,
        title: details?.title ?? properties.title,
        imageUrl:
          details?.imageUrl ??
          properties.thumbUrl ??
          properties.imageUrl,
        date: formatPopupDate(details?.dates),
        featureType: properties.featureType ?? "image",
      })
    );
  } catch (error) {
    console.error("Erro ao carregar detalhes da imagem do mapa", error);

  }

};

// Mostra o popup para o feature.
const showPopupForFeature = (event) => {
  const map = mapInstance.value;
  const feature = event.features?.[0];
  if (!map || !feature) return;

  const coordinates = feature.geometry.coordinates.slice();
  const { thumbUrl, title } = feature.properties ?? {};

  closeActivePopup();

  const popup = new Popup({ // Popup para exibir a miniatura da imagem.
    anchor: "bottom",
    offset: [0, -10],
    closeButton: false,
    className: "locations-map-popup-container",
  })
    .setLngLat(coordinates)
    .setHTML(createCircularPopupContent({ thumbUrl, title }))
    .addTo(map);

  activePopup = popup;

  // Fecha o popup quando o usuário clica fora dele.
  popup.on("close", () => {
    if (activePopup === popup) activePopup = null;
  });

};

/* ------------------------- CLIQUE: seleção laranja ------------------------ */
// Registra o ícone SVG no mapa, se ainda não estiver registrado.
const registerIcon = (map, id, svg) => new Promise((resolve) => {
    if (map.hasImage(id)) return resolve();

    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image(64, 64);

    image.onload = () => {
      if (!map.hasImage(id)) map.addImage(id, image, { pixelRatio: 2 });
      URL.revokeObjectURL(url);
      resolve();
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };

    image.src = url;

});

/* ------------------------------- Seleção ---------------------------------- */
// Define o cursor do mapa.
const setCursor = (value) => {
  const map = mapInstance.value;
  if (map) map.getCanvas().style.cursor = value;
};

// Aproxima o zoom para exibir o ícone selecionado.
const focusOnCoordinates = (coordinates) => {
  const map = mapInstance.value;
  if (!map || !isValidCoordinate(coordinates)) return;

  const currentZoom = map.getZoom();
  const targetZoom = Math.max(currentZoom, SELECTED_ICON_ZOOM);

  map.easeTo({
    center: coordinates,
    zoom: targetZoom,
    duration: SELECTED_ICON_ANIMATION_MS,
    essential: true,
  });

};

// Manipulador de evento para quando o usuário clica em um ponto no mapa.
const handlePointClick = (event) => {
  const feature = event.features?.[0];
  if (!feature) return;

  const map = mapInstance.value;
  const coordinates = feature.geometry.coordinates.slice();
  const id = feature.properties?.id ?? null;

  if (!map || !id) return;

  collapseSpider();
  closeActivePopup();

  if (props.context === "explore") {
    closeActiveCardPopup();
  }

  // Seleção e zoom são compartilhados entre coleção e acervo.
  selectedId.value = id;

  if (props.context === "collection" || props.context === "explore") {
    emit("select", id);
  }

  if (props.context === "explore") {
    map.once("moveend", () => {
      showExploreCardPopup(feature);
    });
  }

  requestAnimationFrame(() => {
    focusOnCoordinates(coordinates);
  });

};

// Constroi a view inicial do mapa.
const buildInitialView = () => {
  const features = getLocatedFeatures();
  if (!features.length) {
    return { type: "point", center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  }

  if (features.length === 1) {
    return {
      type: "point",
      center: features[0].geometry.coordinates,
      zoom: 14,
    };
  }

  const bounds = new LngLatBounds();
  features.forEach((feature) => {
    bounds.extend(feature.geometry.coordinates);
  });

  return { type: "bounds", bounds };

};

const saveInitialView = () => {
  initialView = buildInitialView();
};

/* ------------------------------- Seleção ---------------------------------- */
// Serve para restaurar a seleção inicial após voltar da página da imagem. Ou seja, voltando a imagem que estava selecionada.

let hasAppliedInitialSelection = false;

// Busca uma feature localizada pelo id.
const getFeatureById = (id) =>
  getLocatedFeatures().find((feature) => feature.properties?.id === id) || null;

// Restaura a seleção inicial (após voltar da página da imagem).
const applyInitialSelection = () => {
  if (hasAppliedInitialSelection) return;
  if (!props.initialSelectedId || !mapInstance.value) return;

  const feature = getFeatureById(props.initialSelectedId);
  if (!feature) return;

  const map = mapInstance.value;

  selectedId.value = props.initialSelectedId;
  hasAppliedInitialSelection = true;

  if (props.context === "explore") {
    map.once("moveend", () => {
      showExploreCardPopup(feature);
    });
  }

  requestAnimationFrame(() => {
    focusOnCoordinates(feature.geometry.coordinates.slice());
  });
};

/* ------------------------------- Restauração ---------------------------------- */
// Restaura a view inicial do mapa.
const restoreInitialView = () => {
  const map = mapInstance.value;
  if (!map) return;

  const view = initialView ?? buildInitialView();
  if (!view) return;

  map.stop();

  if (view.type === "point") {
    map.easeTo({
      center: view.center,
      zoom: view.zoom,
      duration: SELECTED_ICON_ANIMATION_MS,
      essential: true,
    });
    return;
  }

  map.fitBounds(view.bounds, {
    padding: 56,
    maxZoom: 14,
    duration: SELECTED_ICON_ANIMATION_MS,
    essential: true,
  });

};

// Limpa a seleção e restaura a view inicial.
const resetToInitial = () => {
  selectedId.value = null;
  emit("select", null);
  collapseSpider();
  closeActivePopup();
  closeActiveCardPopup();

  const map = mapInstance.value;
  if (!map) return;

  let restored = false;

  const run = () => {
    if (restored) return;
    restored = true;
    restoreInitialView();
    map.once("idle", () => {
      captureBaselineView();
    });
  };

  map.once("idle", run);
  window.setTimeout(run, 80);
};

/* ------------------------------- Spiderfy --------------------------------- */

// Compara coordenadas com tolerância para float.
const coordKey = (coordinates) => coordinates.map((value) => Number(value).toFixed(6)).join(",");

// Gera as posições (em px) dos ícones em anéis concêntricos compactos.
// Cada posição carrega o ângulo/raio para desenhar a pétala correspondente.
const generateSpiderPositions = (count) => {
  const positions = [];
  if (count <= 0) return positions;

  const iconSpacing = 38;
  const ringGap = 54;
  const singleRingLimit = 20;

  let placed = 0;
  let ringIndex = 0;
  let previousRadius = 0;

  while (placed < count) {
    const remaining = count - placed;

    const radius =
      ringIndex === 0
        ? Math.max(
            50,
            Math.min(92, (Math.min(count, singleRingLimit) * iconSpacing) / (2 * Math.PI))
          )
        : previousRadius + ringGap;

    const capacity = count <= singleRingLimit
        ? count
        : Math.max(8, Math.floor((2 * Math.PI * radius) / iconSpacing));

    const inRing = Math.min(capacity, remaining);
    const angleStep = (2 * Math.PI) / inRing;
    const angleOffset = -Math.PI / 2 + (ringIndex % 2 === 0 ? 0 : angleStep / 2);

    // Mantém a base da pétala com aproximadamente 28 px de largura.
    const spread = Math.min(angleStep * 0.38, Math.atan2(14, radius));
    const innerRadius = ringIndex === 0 ? 0 : previousRadius + 14;

    for (let i = 0; i < inRing; i += 1) {
      const angle = angleOffset + angleStep * i;
      positions.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        angle,
        radius,
        spread,
        innerRadius,
      });
    }

    placed += inRing;
    previousRadius = radius;
    ringIndex += 1;
  }

  return positions;
};

// Constrói as pétalas (polígonos) e as folhas (câmeras) em forma de roseta.
const buildSpiderFeatures = (map, center, leaves) => {
  const centerPx = map.project(center);
  const positions = generateSpiderPositions(leaves.length);

  const petalFeatures = [];
  const leafFeatures = [];

  const toLngLat = (x, y) => {
    const point = map.unproject([centerPx.x + x, centerPx.y + y]);
    return [point.lng, point.lat];
  };

  leaves.forEach((leaf, index) => {
    const pos = positions[index] ?? {
      x: 0,
      y: 0,
      angle: 0,
      radius: 0,
      spread: 0,
      innerRadius: 0,
    };
    const coordinates = toLngLat(pos.x, pos.y);

    leafFeatures.push({
      type: "Feature",
      geometry: { type: "Point", coordinates },
      properties: {
        ...leaf.properties,
        selected: leaf.properties?.id === selectedId.value,
      },
    });

    if (pos.radius > 0) {
      const apex = toLngLat(
        pos.innerRadius * Math.cos(pos.angle),
        pos.innerRadius * Math.sin(pos.angle)
      );
      const base1 = toLngLat(
        pos.radius * Math.cos(pos.angle - pos.spread),
        pos.radius * Math.sin(pos.angle - pos.spread)
      );
      const base2 = toLngLat(
        pos.radius * Math.cos(pos.angle + pos.spread),
        pos.radius * Math.sin(pos.angle + pos.spread)
      );

      petalFeatures.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [[apex, base1, base2, apex]] },
        properties: {
          selected: leaf.properties?.id === selectedId.value,
        },
      });
    }
  });

  return {
    legs: { type: "FeatureCollection", features: petalFeatures },
    leaves: { type: "FeatureCollection", features: leafFeatures },
  };
};

// Renderiza (ou re-renderiza) o spider a partir do contexto guardado.
const renderSpider = () => {
  const map = mapInstance.value;
  if (!map || !spiderContext) return;

  const { legs, leaves } = buildSpiderFeatures(
    map,
    spiderContext.center,
    spiderContext.leaves
  );

  map.getSource(spiderLegsSourceId)?.setData(legs);
  map.getSource(spiderLeavesSourceId)?.setData(leaves);

};

// Oculta somente o cluster aberto e restaura sua exibição ao fechar o spider.
const setExplodedCluster = (clusterId = null) => {
  const map = mapInstance.value;
  // No unmount o style já pode ter sido destruído.
  if (!map || !map.style) return;

  const filter =
    clusterId == null
      ? ["has", "point_count"]
      : [
          "all",
          ["has", "point_count"],
          ["!=", ["get", "cluster_id"], clusterId],
        ];

  if (map.getLayer(clusterLayerId)) {
    map.setFilter(clusterLayerId, filter);
  }

  if (map.getLayer(clusterCountLayerId)) {
    map.setFilter(clusterCountLayerId, filter);
  }
};

// Fecha o spider e limpa as fontes.
const collapseSpider = () => {
  if (!spiderContext) return;

  spiderContext = null;

  const map = mapInstance.value;
  if (!map || !map.style) return;

  setExplodedCluster();
  map.getSource(spiderLegsSourceId)?.setData(emptyFeatureCollection());
  map.getSource(spiderLeavesSourceId)?.setData(emptyFeatureCollection());
};

// Abre o spider: busca as folhas do cluster e as espalha.
const spiderfyCluster = async (source, clusterId, center) => {
  const leaves = await source.getClusterLeaves(clusterId, 10000, 0);
  if (!leaves?.length) return;

  spiderContext = { center, leaves, clusterId };
  setExplodedCluster(clusterId);
  renderSpider();

};

// Clique em um cluster -> se todas as imagens estão no mesmo ponto, abre o spider;
// caso contrário, aproxima o zoom para expandi-lo.
const handleClusterClick = async (event) => {
  const map = mapInstance.value;
  if (!map) return;

  const features = map.queryRenderedFeatures(event.point, {
    layers: [clusterLayerId, clusterCountLayerId],
  });
  const clusterId = features[0]?.properties?.cluster_id;
  if (clusterId == null) return;

  const source = map.getSource(sourceId);
  if (!source?.getClusterExpansionZoom) return;

  collapseSpider();

  try {
    const leaves = await source.getClusterLeaves(clusterId, 10000, 0);
    const uniqueCoords = new Set(
      leaves.map((leaf) => coordKey(leaf.geometry.coordinates))
    );

    // Todas as imagens no mesmo local -> espalhar em leque.
    if (uniqueCoords.size === 1) {
      await spiderfyCluster(source, clusterId, leaves[0].geometry.coordinates);
      return;
    }

    const zoom = await source.getClusterExpansionZoom(clusterId);

    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom,
      duration: SELECTED_ICON_ANIMATION_MS,
      essential: true,
    });
  } catch {
    // Fazer nada
  }

};

const handleUnclusteredEnter = (event) => {
  setCursor("pointer");
  showPopupForFeature(event);
};

const handleUnclusteredLeave = () => {
  setCursor("");
  closeActivePopup();
};

const handleClusterEnter = () => setCursor("pointer");
const handleClusterLeave = () => setCursor("");

// Hover na folha do spider -> miniatura circular.
const handleSpiderLeafEnter = (event) => {
  setCursor("pointer");
  showPopupForFeature(event);
};

const handleSpiderLeafLeave = () => {
  setCursor("");
  closeActivePopup();
};

// Clique na folha do spider -> seleciona a imagem (sem re-clusterizar).
const handleSpiderLeafClick = (event) => {
  const feature = event.features?.[0];
  const id = feature?.properties?.id ?? null;
  if (!feature || !id) return;

  closeActivePopup();
  selectedId.value = id;
  emit("select", id);
  if (spiderContext) renderSpider();

  if (props.context === "explore") {
    closeActiveCardPopup();
    showExploreCardPopup(feature);
  }
};

// Clique fora do spiderfy -> fecha o leque e restaura o agrupamento.
const handleMapClickOutsideSpider = (event) => {
  if (!spiderContext) return;

  const map = mapInstance.value;
  if (!map) return;

  const spiderLayers = [spiderLeavesLayerId, spiderLegsLayerId].filter((id) =>
    map.getLayer(id)
  );

  if (spiderLayers.length > 0) {
    const hits = map.queryRenderedFeatures(event.point, { layers: spiderLayers });
    if (hits.length > 0) return;
  }

  collapseSpider();
  closeActivePopup();
  closeActiveCardPopup();
};

/* ------------------------------- Mapa ------------------------------------- */
// Ajusta o mapa para exibir todas as features visíveis.
const fitMapToFeatures = () => {
  const map = mapInstance.value;
  if (!map) return;

  // fitBounds calcula o zoom a partir das dimensões do viewport. No primeiro
  // carregamento (ou ao trocar para o modo mapa), o container pode ainda não ter
  // a altura final, o que faz o enquadramento sair "afastado". Garante o resize e
  // adia o fit para quando o mapa estiver ocioso.
  map.resize();

  let fitted = false;
  const run = () => {
    if (fitted) return;
    fitted = true;
    restoreInitialView();
  };

  map.once("idle", run);
  window.setTimeout(run, 80);
};

// Configura as camadas do mapa.
const setupLayers = async (map) => {
  await registerIcon(map, iconId, cameraIconSvg(baseColor));
  await registerIcon(map, selectedIconId, cameraIconSvg(selectedColor));
  await registerIcon(map, workIconId, workIconSvg(baseColor));
  await registerIcon(map, workSelectedIconId, workIconSvg(selectedColor));

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: geoJsonData.value,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
      // has_selected = 1 se algum ponto do cluster estiver selecionado
      clusterProperties: {
        has_selected: ["max", ["case", ["get", "selected"], 1, 0]],
      },
    });
  }

  if (!map.getLayer(clusterLayerId)) {
    map.addLayer({
      id: clusterLayerId,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "case",
          [">", ["get", "has_selected"], 0],
          selectedColor,
          baseColor,
        ],
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
      },
    });
  }

  if (!map.getLayer(clusterCountLayerId)) {
    map.addLayer({
      id: clusterCountLayerId,
      type: "symbol",
      source: sourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
      },
      paint: { "text-color": "#FFFFFF" },
    });
  }

  if (!map.getLayer(unclusteredLayerId)) {
    map.addLayer({
      id: unclusteredLayerId,
      type: "symbol",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": iconImageLayout,
        "icon-size": ["case", ["get", "selected"], 0.95, 0.8],
        "icon-allow-overlap": true,
      },
    });
  }

  if (!map.getSource(spiderLegsSourceId)) {
    map.addSource(spiderLegsSourceId, {
      type: "geojson",
      data: emptyFeatureCollection(),
    });
  }

  if (!map.getSource(spiderLeavesSourceId)) {
    map.addSource(spiderLeavesSourceId, {
      type: "geojson",
      data: emptyFeatureCollection(),
    });
  }

  if (!map.getLayer(spiderLegsLayerId)) {
    map.addLayer({
      id: spiderLegsLayerId,
      type: "fill",
      source: spiderLegsSourceId,
      paint: {
        "fill-color": [
          "case",
          ["get", "selected"],
          selectedColor,
          baseColor,
        ],
        "fill-opacity": 1,
      },
    });
  } else {
    map.setPaintProperty(spiderLegsLayerId, "fill-color", [
      "case",
      ["get", "selected"],
      selectedColor,
      baseColor,
    ]);
  }

  if (!map.getLayer(spiderLeavesLayerId)) {
    map.addLayer({
      id: spiderLeavesLayerId,
      type: "symbol",
      source: spiderLeavesSourceId,
      layout: {
        "icon-image": iconImageLayout,
        "icon-size": ["case", ["get", "selected"], 0.95, 0.8],
        "icon-allow-overlap": true,
      },
    });
  }

  map.on("click", clusterLayerId, handleClusterClick);
  map.on("click", clusterCountLayerId, handleClusterClick);
  map.on("click", unclusteredLayerId, handlePointClick);
  map.on("mouseenter", unclusteredLayerId, handleUnclusteredEnter);
  map.on("mouseleave", unclusteredLayerId, handleUnclusteredLeave);
  map.on("mouseenter", clusterLayerId, handleClusterEnter);
  map.on("mouseleave", clusterLayerId, handleClusterLeave);
  map.on("mouseenter", clusterCountLayerId, handleClusterEnter);
  map.on("mouseleave", clusterCountLayerId, handleClusterLeave);
  map.on("click", spiderLeavesLayerId, handleSpiderLeafClick);
  map.on("mouseenter", spiderLeavesLayerId, handleSpiderLeafEnter);
  map.on("mouseleave", spiderLeavesLayerId, handleSpiderLeafLeave);
  map.on("click", handleMapClickOutsideSpider);
  map.on("zoomstart", collapseSpider);
  map.on("dragstart", collapseSpider);
};

// Manipulador de evento para quando o mapa estiver pronto.
const handleMapReady = async (map) => {
  mapInstance.value = markRaw(map);

  await setupLayers(map);
  saveInitialView();

  if (props.initialSelectedId && getFeatureById(props.initialSelectedId)) {
    applyInitialSelection();
  } else {
    fitMapToFeatures();
  }

  applyMapPitch(props.pitch);

  map.once("idle", () => {
    captureBaselineView();
  });

  map.on("moveend", updateAwayFromInitial);
  map.on("zoomend", updateAwayFromInitial);
};

const handleMapError = (error) => {
  console.error("Erro no mapa da coleção:", error);
};

// Atualiza os dados do source quando imagens ou seleção mudam (re-clusteriza).
watch(geoJsonData, (data) => {
  const source = mapInstance.value?.getSource(sourceId);
  if (source?.setData) source.setData(data);

  // Mantém a cor das folhas do spider sincronizada com a seleção.
  if (spiderContext) renderSpider();
});

// Reposiciona o mapa quando a quantidade de imagens muda.
watch(
  () => props.images,
  () => {
    if (!mapInstance.value) return;

    saveInitialView();

    // Se há uma seleção a restaurar e a imagem já existe, foca nela.
    if (
      !hasAppliedInitialSelection &&
      props.initialSelectedId &&
      getFeatureById(props.initialSelectedId)

    ) {
      applyInitialSelection();
      mapInstance.value?.once("idle", () => {
        captureBaselineView();
      });
      return;

    }

    selectedId.value = null;
    emit("select", null);
    fitMapToFeatures();

    mapInstance.value?.once("idle", () => {
      captureBaselineView();
    });

  },
  { deep: true }
);

watch(
  () => props.pitch,
  (pitch) => {
    applyMapPitch(pitch ?? 0);
  }
);

defineExpose({ resetToInitial });

/* ------------------------------- Desmontagem ---------------------------------- */
// Desmonta o mapa e limpa as fontes e camadas.
onUnmounted(() => {
  isUnmounting = true;

  const map = mapInstance.value;

  if (map) {
    map.off("moveend", updateAwayFromInitial);
    map.off("zoomend", updateAwayFromInitial);
  }

  if (map && map.style) {
    collapseSpider();
  } else {
    spiderContext = null;
  }

  closeActivePopup();
  closeActiveCardPopup();

  if (map && map.style) {
    [
      clusterLayerId,
      clusterCountLayerId,
      unclusteredLayerId,
      spiderLegsLayerId,
      spiderLeavesLayerId,
    ].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    [sourceId, spiderLegsSourceId, spiderLeavesSourceId].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });

    if (map.hasImage(iconId)) map.removeImage(iconId);
    if (map.hasImage(selectedIconId)) map.removeImage(selectedIconId);
    if (map.hasImage(workIconId)) map.removeImage(workIconId);
    if (map.hasImage(workSelectedIconId)) map.removeImage(workSelectedIconId);    
  }

  mapInstance.value = null;
});
</script>

<template>
  <div
    class="locations-map"
    :aria-label="context === 'explore' ? 'Mapa do acervo' : 'Mapa das imagens da coleção'"
  >
    <MapLibreMap
      class="locations-map__canvas"
      :style-url="styleUrl"
      :map-options="initialMapOptions"
      @map-ready="handleMapReady"
      @map-error="handleMapError"
    />

    <div
      v-if="isLoading"
      class="locations-map__state"
      role="status"
    >
      Carregando mapa...
    </div>

    <p
      v-if="!isLoading && !hasLocatedImages"
      class="locations-map__empty"
    >
      {{ emptyMessage }}
    </p>

    <button
      v-if="isAwayFromInitial"
      type="button"
      class="locations-map__hint"
      aria-label="Voltar ao zoom original"
      @click="resetToInitial"
    >
      <span class="locations-map__hint-icon" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0.118945 12.8394C0.195128 12.9156 0.29844 12.9584 0.406163 12.9584C0.513886 12.9584 0.617199 12.9156 0.693382 12.8394L4.02138 9.51145V11.7604C4.02138 11.8682 4.06418 11.9715 4.14037 12.0477C4.21656 12.1239 4.31989 12.1667 4.42763 12.1667C4.53538 12.1667 4.63871 12.1239 4.71489 12.0477C4.79108 11.9715 4.83388 11.8682 4.83388 11.7604V8.53076C4.83388 8.42301 4.79108 8.31968 4.71489 8.2435C4.63871 8.16731 4.53538 8.12451 4.42763 8.12451H1.19794C1.0902 8.12451 0.986869 8.16731 0.910682 8.2435C0.834496 8.31968 0.791695 8.42301 0.791695 8.53076C0.791695 8.6385 0.834496 8.74183 0.910682 8.81802C0.986869 8.89421 1.0902 8.93701 1.19794 8.93701H3.44694L0.118945 12.265C0.0427844 12.3412 0 12.4445 0 12.5522C0 12.6599 0.0427844 12.7633 0.118945 12.8394V12.8394ZM12.8394 0.118945C12.7633 0.0427844 12.6599 0 12.5522 0C12.4445 0 12.3412 0.0427844 12.265 0.118945L8.93701 3.44694V1.19794C8.93701 1.0902 8.89421 0.986869 8.81802 0.910682C8.74183 0.834496 8.6385 0.791695 8.53076 0.791695C8.42301 0.791695 8.31968 0.834496 8.2435 0.910682C8.16731 0.986869 8.12451 1.0902 8.12451 1.19794V4.42763C8.12451 4.53538 8.16731 4.63871 8.2435 4.71489C8.31968 4.79108 8.42301 4.83388 8.53076 4.83388H11.7604C11.8682 4.83388 11.9715 4.79108 12.0477 4.71489C12.1239 4.63871 12.1667 4.53538 12.1667 4.42763C12.1667 4.31989 12.1239 4.21656 12.0477 4.14037C11.9715 4.06418 11.8682 4.02138 11.7604 4.02138H9.51145L12.8394 0.693382C12.9156 0.617199 12.9584 0.513886 12.9584 0.406163C12.9584 0.29844 12.9156 0.195128 12.8394 0.118945V12.8394Z"
            fill="white"
          />
        </svg>
      </span>
      <span class="locations-map__hint-text">Zoom original</span>
    </button>
  </div>
</template>

<style scoped>
.locations-map {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 480px;
  height: 100%;
  border-radius: 5px;
  overflow: hidden;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  background: var(--Off_white, #faf9f9);
  box-sizing: border-box;
}

.locations-map__canvas {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.locations-map__state,
.locations-map__empty {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 24px;
  box-sizing: border-box;
  text-align: center;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  line-height: 150%;
  background: rgba(250, 249, 249, 0.92);
  pointer-events: none;
}

.locations-map__hint {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 3;
  display: inline-flex;
  padding: 8px 12px;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 4px;
  background: var(--Cinza_E, #2f2f2f);
  cursor: pointer;
  pointer-events: auto;
}

.locations-map__hint:hover {
  background: #3f3f3f;
}

.locations-map__hint:focus-visible {
  outline: 2px solid var(--Laranja_C, #d27d30);
  outline-offset: 2px;
}

.locations-map__hint-icon {
  display: inline-flex;
  width: 12.958px;
  height: 12.958px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.locations-map__hint-text {
  color: var(--Branco, #fff);
  font-family: "DM Sans";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 115%;
}
</style>

<style>
.locations-map-popup-container.maplibregl-popup {
  z-index: 5;
  pointer-events: none;
}

.locations-map-popup-container .maplibregl-popup-content {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.locations-map-popup-container .maplibregl-popup-tip {
  display: none;
}

.locations-map-popup {
  display: flex;
  align-items: center;
  justify-content: center;
}

.locations-map-popup__thumb {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--Preto, #1f1f1f);
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.locations-map-popup__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.locations-map-card-popup-container.maplibregl-popup {
  z-index: 6;
  width: 280px;
  max-width: calc(100vw - 32px);
}

.locations-map-card-popup-container .maplibregl-popup-content {
  padding: 0;
  overflow: hidden;
  border-radius: 5px;
  background: var(--Branco, #fff);
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
}

.locations-map-card-popup-container .maplibregl-popup-tip {
  border-top-color: var(--Branco, #fff);
}

.locations-map-card-popup-container .maplibregl-popup-close-button {
  z-index: 2;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--Cinza_E, #2f2f2f);
  background: rgba(255, 255, 255, 0.92);
  font-size: 20px;
  line-height: 28px;
}

.locations-map-card {
  overflow: hidden;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  border-radius: 5px;
  background: var(--Branco, #fff);
}

.locations-map-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8f9fa;
}

.locations-map-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.locations-map-card__content {
  padding: 16px;
}

.locations-map-card__title {
  margin: 0 0 4px;
  overflow: hidden;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 125%;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.locations-map-card__date {
  margin: 0;
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 125%;
}

.locations-map-card__button {
  display: flex;
  width: 100%;
  margin-top: 16px;
  padding: 10px 14px;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  border: 1px solid #d27d30;
  border-radius: 4px;
  color: #d27d30;
  background: transparent;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 125%;
  text-decoration: none;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.locations-map-card__button:hover {
  color: var(--Branco, #fff);
  background: #d27d30;
  text-decoration: none;
}

.locations-map-card__button:focus-visible {
  outline: 2px solid #d27d30;
  outline-offset: 2px;
}
</style>
