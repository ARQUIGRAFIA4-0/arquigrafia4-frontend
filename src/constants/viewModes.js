export const VIEW_OPTIONS = [
  {
    selection: "mar",
    label: "Mar de imagens",
    route: "mar",
    mode: "grid",
    icon: "bi-image",
    showFooter: true,
  },
  {
    selection: "grid",
    label: "Grade",
    route: "grid",
    mode: "grid",
    icon: "bi-grid",
    showFooter: true,
  },
  {
    selection: "mosaic",
    label: "Mosaico",
    route: "mosaic",
    mode: "mosaic",
    icon: "bi-grid-1x2",
    showFooter: false,
  },
  {
    selection: "mosaic-outro",
    label: "Mosaico",
    route: "mosaic-outro",
    mode: "mosaicOutro",
    icon: "bi-grid-3x3-gap",
    showFooter: false,
  },
  {
    selection: "map",
    label: "Mapa",
    route: "map",
    mode: "map",
    icon: "bi-map",
    subcontrol: {
      id: "map-settings",
      icon: "bi-box",
      label: "Abrir configurações do mapa",
    },
    showFooter: false,
  },
];

export const DEFAULT_VIEW_SELECTION = "mosaic";
export const DEFAULT_VIEW_ROUTE = "mosaic";

const routeMap = new Map(
  VIEW_OPTIONS.map((option) => [option.route, { ...option }])
);

const selectionMap = new Map(
  VIEW_OPTIONS.map((option) => [option.selection, { ...option }])
);

const normalizeKey = (value) => value?.toString().trim().toLowerCase() || "";

export const isValidViewRoute = (routeParam) => routeMap.has(normalizeKey(routeParam));

export const normalizeViewRoute = (routeParam) => {
  const normalized = normalizeKey(routeParam);
  return routeMap.has(normalized) ? normalized : DEFAULT_VIEW_ROUTE;
};

export const resolveViewOptionByRoute = (routeParam) =>
  routeMap.get(normalizeViewRoute(routeParam)) ||
  routeMap.get(DEFAULT_VIEW_ROUTE);

export const resolveViewOptionBySelection = (selection) =>
  selectionMap.get(normalizeKey(selection)) ||
  selectionMap.get(DEFAULT_VIEW_SELECTION);

export const viewRouteToSelection = (routeParam) =>
  resolveViewOptionByRoute(routeParam).selection;

export const selectionToViewRoute = (selection) =>
  resolveViewOptionBySelection(selection).route;

export const selectionToViewMode = (selection) =>
  resolveViewOptionBySelection(selection).mode;

export const selectionToViewIcon = (selection) =>
  resolveViewOptionBySelection(selection).icon;

export const viewOptions = () => VIEW_OPTIONS.map((option) => ({ ...option }));

