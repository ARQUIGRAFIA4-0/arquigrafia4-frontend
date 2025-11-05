import { defineComponent, h, reactive } from "vue";
import Toolbar from "./Toolbar.vue";

const createAdvancedFilters = (overrides = {}) => ({
  terms: [],
  locations: [],
  tags: [],
  use: null,
  ...overrides,
});

const createDateRange = (overrides = {}) => ({
  start: "",
  end: "",
  ...overrides,
});

function mountToolbar(options = {}) {
  const ControlledToolbar = defineComponent({
    name: "ControlledToolbar",
    setup() {
      const state = reactive({
        searchMode: options.searchMode ?? "textual",
        textQuery: options.textQuery ?? "",
        dateRange: createDateRange(options.dateRange),
        color: options.color ?? "",
        advancedFilters: createAdvancedFilters(options.advancedFilters),
        viewSelection: options.viewSelection ?? "grid",
        mapSettings: options.mapSettings ?? "2d",
      });

      return () =>
        h(Toolbar, {
          searchMode: state.searchMode,
          textQuery: state.textQuery,
          dateRange: state.dateRange,
          color: state.color,
          advancedFilters: state.advancedFilters,
          viewSelection: state.viewSelection,
          mapSettings: state.mapSettings,
          onConfirm: options.onConfirm,
          onOpenAdvancedSearch: options.onOpenAdvancedSearch,
          onViewSubcontrol: (payload) => {
            state.mapSettings = payload.value;
            options.onViewSubcontrol?.(payload);
          },
          onSearchModeChange: (mode) => {
            state.searchMode = mode;
            options.onSearchModeChange?.(mode);
          },
          onViewChange: (payload) => {
            state.viewSelection = payload.selection;
            options.onViewChange?.(payload);
          },
          "onUpdate:text-query": (value) => {
            state.textQuery = value;
            options.onUpdateTextQuery?.(value);
          },
          "onUpdate:date-range": (range) => {
            state.dateRange = createDateRange(range);
            options.onUpdateDateRange?.(range);
          },
          "onUpdate:color": (color) => {
            state.color = color;
            options.onUpdateColor?.(color);
          },
          "onUpdate:map-settings": (value) => {
            state.mapSettings = value;
            options.onUpdateMapSettings?.(value);
          },
        });
    },
  });

  return cy.mount(ControlledToolbar);
}

describe("<Toolbar />", () => {
  it("renderiza modo textual por padrão e esconde os demais", () => {
    mountToolbar();

    cy.get("#search-input-textual").should("be.visible");
    cy.get("#search-input-avancada").should("not.be.visible");
    cy.get("#search-input-data").should("not.be.visible");
    cy.get("#search-input-cor").should("not.be.visible");
  });

  it("alterna modos de busca e atualiza estado ativo", () => {
    mountToolbar();

    const openDropdown = () => cy.get("#search-mode-dropdown").click();
    const clickItem = (label) =>
      cy.contains(".dropdown-menu .dropdown-item", label).click();
    const assertIcon = (expectedClass) =>
      cy
        .get("#search-mode-dropdown i")
        .should("have.class", expectedClass)
        .and("have.class", "bi");
    const assertDropdownIcon = (label, expectedClass) => {
      openDropdown();
      cy.contains(".dropdown-menu .dropdown-item", label)
        .find("i")
        .should("have.class", expectedClass)
        .and("have.class", "bi");
      cy.get("#search-mode-dropdown").click();
    };
    const assertActive = (label) => {
      openDropdown();
      cy.contains(".dropdown-menu .dropdown-item.active", label).should(
        "exist"
      );
      cy.get("#search-mode-dropdown").click();
    };

    assertIcon("bi-search");
    assertDropdownIcon("Busca textual", "bi-search");
    assertDropdownIcon("Busca por cor", "bi-palette");
    assertDropdownIcon("Busca por data", "bi-calendar2-week");
    assertDropdownIcon("Busca avançada", "bi-gear");

    // To Data
    openDropdown();
    clickItem("Busca por data");
    cy.get("#search-input-data").should("be.visible");
    cy.get("#search-input-textual").should("not.be.visible");
    assertActive("Busca por data");
    assertIcon("bi-calendar2-week");

    // To Color
    openDropdown();
    clickItem("Busca por cor");
    cy.get("#search-input-cor").should("be.visible");
    cy.get("#search-input-data").should("not.be.visible");
    assertActive("Busca por cor");
    assertIcon("bi-palette");

    // To Advanced
    openDropdown();
    clickItem("Busca avançada");
    cy.get("#search-input-textual").should("not.be.visible");
    cy.get("#search-input-cor").should("not.be.visible");
    cy.get("#confirm-search i").should("have.class", "bi-pencil-square");
    assertActive("Busca avançada");
    assertIcon("bi-gear");

    // Back to Textual
    openDropdown();
    clickItem("Busca textual");
    cy.get("#search-input-textual").should("be.visible");
    cy.get("#search-input-avancada").should("not.be.visible");
    assertActive("Busca textual");
    assertIcon("bi-search");
  });

  it("emite confirm ao buscar por texto", () => {
    const onConfirm = cy.stub().as("onConfirm");
    mountToolbar({ onConfirm });

    cy.get('#search-input-textual input[type="text"]').type("casa");
    cy.get("#confirm-search").click();

    cy.get("@onConfirm").should("have.been.calledOnce");
    cy.get("@onConfirm").its("firstCall.args.0").should("deep.equal", {
      mode: "textual",
      value: "casa",
    });
  });

  it("emite valor nulo quando a busca textual está vazia", () => {
    const onConfirm = cy.stub().as("onConfirm");
    mountToolbar({ onConfirm });

    cy.get("#confirm-search").click();
    cy.get("@onConfirm").its("firstCall.args.0").should("deep.equal", {
      mode: "textual",
      value: null,
    });
  });

  it("permite editar filtros avançados pelo botão principal quando existem filtros", () => {
    const onConfirm = cy.stub().as("onConfirm");
    const onOpenAdvancedSearch = cy.stub().as("onOpenAdvancedSearch");
    const filtros = {
      terms: [{ value: "moderno", label: "Moderno" }],
      locations: ["São Paulo"],
      tags: ["Arquitetura"],
      use: "commercial",
    };
    mountToolbar({
      onConfirm,
      onOpenAdvancedSearch,
      advancedFilters: filtros,
    });

    cy.get("#search-mode-dropdown").click();
    cy.contains(".dropdown-menu .dropdown-item", "Busca avançada").click();

    cy.get("@onOpenAdvancedSearch").should("have.been.calledOnce");

    cy.get("#confirm-search i").should("have.class", "bi-pencil-square");

    cy.get("#confirm-search").click();

    cy.get("@onOpenAdvancedSearch").should("have.callCount", 2);
    cy.get("@onConfirm").should("not.have.been.called");
  });

  it("emite confirm para busca por data", () => {
    const onConfirm = cy.stub().as("onConfirm");
    mountToolbar({ onConfirm });

    cy.get("#search-mode-dropdown").click();
    cy.contains(".dropdown-menu .dropdown-item", "Busca por data").click();
    cy.get('#search-input-data input[type="date"]').eq(0).type("2023-01-01");
    cy.get('#search-input-data input[type="date"]').eq(1).type("2023-12-31");
    cy.get("#confirm-search").click();

    cy.get("@onConfirm")
      .its("firstCall.args.0")
      .should("deep.equal", {
        mode: "data",
        value: { start: "2023-01-01", end: "2023-12-31" },
      });
  });

  it("emite confirm para busca por cor", () => {
    const onConfirm = cy.stub().as("onConfirm");
    mountToolbar({ onConfirm });

    cy.get("#search-mode-dropdown").click();
    cy.contains(".dropdown-menu .dropdown-item", "Busca por cor").click();
    cy.get('#search-input-cor input[type="range"]')
      .invoke("val", 0)
      .trigger("input");
    cy.get("#confirm-search").click();

    cy.get("@onConfirm").its("firstCall.args.0").should("deep.equal", {
      mode: "cor",
      value: "#ff0000",
    });
  });

  it("emite view-change para todas as opções de visualização", () => {
    const onViewChange = cy.stub().as("onViewChange");
    mountToolbar({ onViewChange });

    const openViewDropdown = () => cy.get("#view-mode-dropdown").click();
    const clickViewItem = (label) =>
      cy.contains(".dropdown-menu .dropdown-item", label).click();
    const assertViewIcon = (expectedClass) =>
      cy
        .get("#view-mode-dropdown i")
        .should("have.class", expectedClass)
        .and("have.class", "bi");
    const assertViewDropdownIcon = (label, expectedClass) => {
      openViewDropdown();
      cy.contains(".dropdown-menu .dropdown-item", label)
        .find("i")
        .should("have.class", expectedClass)
        .and("have.class", "bi");
      cy.get("#view-mode-dropdown").click();
    };

    assertViewIcon("bi-grid");
    assertViewDropdownIcon("Mar de imagens", "bi-image");
    assertViewDropdownIcon("Mapa", "bi-map");
    assertViewDropdownIcon("Grade", "bi-grid");
    assertViewDropdownIcon("Mosaico", "bi-grid-1x2");

    const assertViewChangeCall = (index, expected) =>
      cy
        .get("@onViewChange")
        .invoke("getCall", index)
        .its("args.0")
        .should("deep.equal", expected);

    // Mar de imagens -> grid
    openViewDropdown();
    clickViewItem("Mar de imagens");
    assertViewIcon("bi-image");
    assertViewChangeCall(0, {
      selection: "mar",
      mode: "grid",
      route: "mar",
    });

    // Mapa -> map
    openViewDropdown();
    clickViewItem("Mapa");
    assertViewIcon("bi-map");
    assertViewChangeCall(1, {
      selection: "map",
      mode: "map",
      route: "map",
    });

    // Grade -> grid
    openViewDropdown();
    clickViewItem("Grade");
    assertViewIcon("bi-grid");
    assertViewChangeCall(2, {
      selection: "grid",
      mode: "grid",
      route: "grid",
    });

    // Mosaico -> mosaic
    openViewDropdown();
    clickViewItem("Mosaico");
    assertViewIcon("bi-grid-1x2");
    assertViewChangeCall(3, {
      selection: "mosaic",
      mode: "mosaic",
      route: "mosaic",
    });
    cy.get("@onViewChange").its("callCount").should("eq", 4);
  });

  it("alternar subcontrole do mapa atualiza query e estado", () => {
    const onViewSubcontrol = cy.stub().as("onViewSubcontrol");
    const onUpdateMapSettings = cy.stub().as("onUpdateMapSettings");
    mountToolbar({ onViewSubcontrol, onUpdateMapSettings });

    const openViewDropdown = () => cy.get("#view-mode-dropdown").click();

    openViewDropdown();
    cy.contains(".dropdown-menu .dropdown-item", "Mapa").click();

    cy.get(".btn-subcontrol").as("mapToggle");

    cy.get("@mapToggle")
      .should("not.have.class", "active")
      .and("have.attr", "aria-pressed", "false");

    cy.get("@mapToggle").click();

    cy.get("@mapToggle")
      .should("have.class", "active")
      .and("have.attr", "aria-pressed", "true");
    cy.get("@onUpdateMapSettings").should("have.been.calledWith", "3d");
    cy.get("@onViewSubcontrol")
      .invoke("getCall", 0)
      .its("args.0")
      .should("include", { value: "3d" });

    cy.get("@mapToggle").click();

    cy.get("@mapToggle")
      .should("not.have.class", "active")
      .and("have.attr", "aria-pressed", "false");
    cy.get("@onUpdateMapSettings").should("have.been.calledWith", "2d");
    cy.get("@onViewSubcontrol")
      .invoke("getCall", 1)
      .its("args.0")
      .should("include", { value: "2d" });
    cy.get("@onViewSubcontrol").its("callCount").should("eq", 2);
  });

  it("abre a configuração de filtros avançados quando selecionado sem filtros", () => {
    const onOpenAdvancedSearch = cy.stub().as("onOpenAdvancedSearch");
    mountToolbar({ onOpenAdvancedSearch });

    cy.get("#search-mode-dropdown").click();
    cy.contains(".dropdown-menu .dropdown-item", "Busca avançada").click();

    cy.get("@onOpenAdvancedSearch").should("have.been.calledOnce");
    cy.contains("button", "Configurar filtros avançados").should("not.exist");
    cy.get("#confirm-search i").should("have.class", "bi-pencil-square");

    cy.get("#confirm-search").click();

    cy.get("@onOpenAdvancedSearch").should("have.callCount", 2);
  });

  it("renderiza chips de filtros avançados e permite ajustes", () => {
    const filtros = {
      terms: [{ value: "moderno", label: "Moderno" }],
      locations: ["São Paulo"],
      tags: ["Arquitetura"],
      use: "commercial",
    };
    const onOpenAdvancedSearch = cy.stub().as("onOpenAdvancedSearch");

    mountToolbar({ advancedFilters: filtros, onOpenAdvancedSearch });

    cy.get("#search-mode-dropdown").click();
    cy.contains(".dropdown-menu .dropdown-item", "Busca avançada").click();

    cy.contains(".btn-tag", "Moderno").should("be.visible");
    cy.contains(".btn-tag", "Localização: São Paulo").should("be.visible");
    cy.contains(".btn-tag", "+2").should("be.visible");
    cy.contains(".btn-tag", "Tag: Arquitetura").should("not.exist");
    cy.contains(".btn-tag", "Uso: Permite uso comercial").should("not.exist");

    cy.contains("button", "Ajustar filtros").should("not.exist");

    cy.get("#confirm-search i").should("have.class", "bi-pencil-square");

    cy.contains(".btn-tag", "Moderno").should("be.visible");
  });
});
