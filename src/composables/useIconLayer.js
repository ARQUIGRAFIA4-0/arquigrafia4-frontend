import { isRef, onScopeDispose, shallowRef, unref, watch } from "vue";
import { Popup } from "maplibre-gl";

const getDefaultLayerIds = (sourceId) => ({
  cluster: `${sourceId}-clusters`,
  clusterCount: `${sourceId}-cluster-count`,
  unclustered: `${sourceId}-unclustered`,
});

export const useIconLayer = ({
  mapRef,
  sourceId,
  iconId,
  iconSvg,
  baseColor,
  data,
  clusterMaxZoom = 14,
  clusterRadius = 50,
  layerIds,
  getPopupContent,
  onClusterClick,
  onUnclusteredPointClick,
}) => {
  const resolvedLayerIds = layerIds ?? getDefaultLayerIds(sourceId);
  const iconObjectUrl = shallowRef(null);
  let stopWatchData = null;

  const createIconObjectUrl = () => {
    if (iconObjectUrl.value !== null || typeof window === "undefined") {
      return iconObjectUrl.value;
    }

    iconObjectUrl.value = URL.createObjectURL(
      new Blob([iconSvg], { type: "image/svg+xml" })
    );

    return iconObjectUrl.value;
  };

  const releaseIconObjectUrl = () => {
    if (iconObjectUrl.value === null || typeof window === "undefined") return;
    URL.revokeObjectURL(iconObjectUrl.value);
    iconObjectUrl.value = null;
  };

  const ensureIcon = async () => {
    const map = mapRef.value;
    if (!map || map.hasImage(iconId)) return;

    try {
      const iconUrl = createIconObjectUrl();
      if (!iconUrl) return;

      await new Promise((resolve, reject) => {
        const image = new Image(64, 64);
        image.onload = () => {
          map.addImage(iconId, image, { pixelRatio: 2 });
          resolve();
        };
        image.onerror = (error) => {
          reject(error ?? new Error("Failed to load icon"));
        };
        image.src = iconUrl;
      });
    } catch (error) {
      console.error("Error while adding icon", error);
    }
  };

  const defaultClusterClick = async (event) => {
    const map = mapRef.value;
    if (!map) return;

    const features = map.queryRenderedFeatures(event.point, {
      layers: [resolvedLayerIds.cluster],
    });

    if (!features.length) return;

    const clusterFeature = features[0];
    const clusterId = clusterFeature.properties?.cluster_id;
    if (clusterId === undefined) return;

    const source = map.getSource(sourceId);
    if (!source || !("getClusterExpansionZoom" in source)) return;

    const zoom = await source.getClusterExpansionZoom(clusterId);

    map.easeTo({
      center: clusterFeature.geometry.coordinates,
      zoom,
    });
  };

  const defaultUnclusteredPointClick = (event) => {
    const map = mapRef.value;
    const feature = event.features?.[0];

    if (!map || !feature || typeof getPopupContent !== "function") return;

    const coordinates = feature.geometry.coordinates.slice();

    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupContent = getPopupContent(feature);
    if (!popupContent) return;

    new Popup({ anchor: "bottom-left" })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);
  };

  const handleClusterClick = onClusterClick ?? defaultClusterClick;
  const handleUnclusteredPointClick =
    onUnclusteredPointClick ?? defaultUnclusteredPointClick;

  const handleClusterMouseEnter = () => {
    const map = mapRef.value;
    if (!map) return;
    map.getCanvas().style.cursor = "pointer";
  };

  const handleClusterMouseLeave = () => {
    const map = mapRef.value;
    if (!map) return;
    map.getCanvas().style.cursor = "";
  };

  const setupLayer = async () => {
    const map = mapRef.value;
    if (!map) return;

    if (map.getSource(sourceId)) return;

    await ensureIcon();

    map.addSource(sourceId, {
      type: "geojson",
      data: unref(data),
      cluster: true,
      clusterMaxZoom,
      clusterRadius,
    });

    map.addLayer({
      id: resolvedLayerIds.cluster,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": baseColor,
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20,
          100,
          30,
          750,
          40,
        ],
      },
    });

    map.addLayer({
      id: resolvedLayerIds.clusterCount,
      type: "symbol",
      source: sourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#FFFFFF",
      },
    });

    map.addLayer({
      id: resolvedLayerIds.unclustered,
      type: "symbol",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": iconId,
        "icon-size": 0.8,
        "icon-allow-overlap": true,
      },
    });

    map.on("click", resolvedLayerIds.cluster, handleClusterClick);
    map.on("click", resolvedLayerIds.unclustered, handleUnclusteredPointClick);
    map.on("mouseenter", resolvedLayerIds.cluster, handleClusterMouseEnter);
    map.on("mouseleave", resolvedLayerIds.cluster, handleClusterMouseLeave);

    if (isRef(data)) {
      stopWatchData = watch(
        data,
        (newData) => {
          const source = map.getSource(sourceId);
          if (!source || typeof source.setData !== "function") return;
          source.setData(newData);
        },
        { flush: "post" }
      );
    }
  };

  const teardownLayer = () => {
    const map = mapRef?.value ?? null;

    if (typeof stopWatchData === "function") {
      stopWatchData();
      stopWatchData = null;
    }

    if (!map || !map.style) {
      releaseIconObjectUrl();
      return;
    }

    if (typeof map.off === "function") {
      map.off("click", resolvedLayerIds.cluster, handleClusterClick);
      map.off(
        "click",
        resolvedLayerIds.unclustered,
        handleUnclusteredPointClick
      );
      map.off("mouseenter", resolvedLayerIds.cluster, handleClusterMouseEnter);
      map.off("mouseleave", resolvedLayerIds.cluster, handleClusterMouseLeave);
    }

    const hasLayerApi =
      typeof map.getLayer === "function" &&
      typeof map.removeLayer === "function";
    if (hasLayerApi) {
      if (map.getLayer(resolvedLayerIds.cluster)) {
        map.removeLayer(resolvedLayerIds.cluster);
      }
      if (map.getLayer(resolvedLayerIds.clusterCount)) {
        map.removeLayer(resolvedLayerIds.clusterCount);
      }
      if (map.getLayer(resolvedLayerIds.unclustered)) {
        map.removeLayer(resolvedLayerIds.unclustered);
      }
    }

    if (
      typeof map.getSource === "function" &&
      typeof map.removeSource === "function" &&
      map.getSource(sourceId)
    ) {
      map.removeSource(sourceId);
    }

    if (
      typeof map.hasImage === "function" &&
      typeof map.removeImage === "function" &&
      map.hasImage(iconId)
    ) {
      map.removeImage(iconId);
    }

    releaseIconObjectUrl();
  };

  onScopeDispose(() => {
    teardownLayer();
  });

  return {
    setupLayer,
    teardownLayer,
  };
};



