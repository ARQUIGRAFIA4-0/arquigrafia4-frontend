import { defineComponent, reactive } from "vue";
import ToolbarMobile from "./ToolbarMobile.vue";

const mountMobileToolbar = (initial = {}) => {
  const searchModeChangeSpy = cy.stub().as("searchModeChangeSpy");
  const openViewSpy = cy.stub().as("openViewSpy");
  const openTextSpy = cy.stub().as("openTextSpy");
  const openColorSpy = cy.stub().as("openColorSpy");
  const openDateSpy = cy.stub().as("openDateSpy");

  const Wrapper = defineComponent({
    components: { ToolbarMobile },
    setup() {
      const state = reactive({
        viewSelection: initial.viewSelection ?? "grid",
        searchMode: initial.searchMode ?? "textual",
      });

      const handleSearchModeChange = (mode) => {
        state.searchMode = mode;
        searchModeChangeSpy(mode);
      };

      return () => (
        <ToolbarMobile
          viewSelection={state.viewSelection}
          searchMode={state.searchMode}
          onSearchModeChange={handleSearchModeChange}
          onOpenViewMenu={() => openViewSpy()}
          onOpenSearchText={() => openTextSpy()}
          onOpenSearchColor={() => openColorSpy()}
          onOpenSearchDate={() => openDateSpy()}
        />
      );
    },
  });

  cy.mount(() => <Wrapper />);
};

describe("<ToolbarMobile />", () => {
  it("renderiza ícones com base no modo atual", () => {
    mountMobileToolbar({ viewSelection: "grid" });
    cy.get("#view-mode-button i").should("have.class", "bi-grid");
    cy.get("#search-text-button").should("have.class", "active");

    cy.then(() => mountMobileToolbar({ viewSelection: "mosaic" }));
    cy.get("#view-mode-button i").should("have.class", "bi-grid-1x2");

    cy.then(() => mountMobileToolbar({ viewSelection: "map" }));
    cy.get("#view-mode-button i").should("have.class", "bi-map");
  });

  it("emite eventos de abertura de menus", () => {
    mountMobileToolbar();

    cy.get("#view-mode-button").click();
    cy.get("#search-text-button").click();
    cy.get("#search-color-button").click();
    cy.get("#search-date-button").click();

    cy.get("@openViewSpy").should("have.been.calledOnce");
    cy.get("@openTextSpy").should("have.been.calledOnce");
    cy.get("@openColorSpy").should("have.been.calledOnce");
    cy.get("@openDateSpy").should("have.been.calledOnce");
  });

  it("emite alteração de modo de busca ao clicar nos botões", () => {
    mountMobileToolbar();

    cy.get("#search-color-button").click();
    cy.get("@searchModeChangeSpy").should("have.been.calledWith", "cor");

    cy.get("#search-date-button").click();
    cy.get("@searchModeChangeSpy").should("have.been.calledWith", "data");

    cy.get("#search-text-button").click();
    cy.get("@searchModeChangeSpy").should("have.been.calledWith", "textual");
  });
});
