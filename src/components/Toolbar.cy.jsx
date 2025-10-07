import Toolbar from "./Toolbar.vue";

describe("<Toolbar />", () => {
  it("renderiza modo textual por padrão e esconde os demais", () => {
    cy.mount(() => <Toolbar />);

    cy.get("#search-input-textual").should("be.visible");
    cy.get("#search-input-avancada").should("not.be.visible");
    cy.get("#search-input-data").should("not.be.visible");
    cy.get("#search-input-cor").should("not.be.visible");
  });

  it("alterna modos de busca e atualiza estado ativo", () => {
    cy.mount(() => <Toolbar />);

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
    cy.mount(() => <Toolbar onConfirm={onConfirm} />);

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
    cy.mount(() => <Toolbar onConfirm={onConfirm} />);

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
    cy.mount(() => (
      <Toolbar
        onConfirm={onConfirm}
        onOpenAdvancedSearch={onOpenAdvancedSearch}
        advancedFilters={filtros}
      />
    ));

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
    cy.mount(() => <Toolbar onConfirm={onConfirm} />);

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
    cy.mount(() => <Toolbar onConfirm={onConfirm} />);

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
    cy.mount(() => <Toolbar onViewChange={onViewChange} />);

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

    // Mar de imagens -> grid
    openViewDropdown();
    clickViewItem("Mar de imagens");
    cy.get("@onViewChange").should("have.been.calledWith", "grid");
    assertViewIcon("bi-image");

    // Mapa -> map
    openViewDropdown();
    clickViewItem("Mapa");
    cy.get("@onViewChange").should("have.been.calledWith", "map");
    assertViewIcon("bi-map");

    // Grade -> grid
    openViewDropdown();
    clickViewItem("Grade");
    cy.get("@onViewChange").should("have.been.calledWith", "grid");
    assertViewIcon("bi-grid");

    // Mosaico -> mosaic
    openViewDropdown();
    clickViewItem("Mosaico");
    cy.get("@onViewChange").should("have.been.calledWith", "mosaic");
    assertViewIcon("bi-grid-1x2");

    // Ensure total calls count
    cy.get("@onViewChange").should("have.callCount", 4);
  });

  it("abre a configuração de filtros avançados quando selecionado sem filtros", () => {
    const onOpenAdvancedSearch = cy.stub().as("onOpenAdvancedSearch");
    cy.mount(() => <Toolbar onOpenAdvancedSearch={onOpenAdvancedSearch} />);

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

    cy.mount(() => (
      <Toolbar
        advancedFilters={filtros}
        onOpenAdvancedSearch={onOpenAdvancedSearch}
      />
    ));

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
