import ToolbarMobile from "./ToolbarMobile.vue";

describe("<ToolbarMobile />", () => {
  it("renders two button groups", () => {
    cy.mount(() => <ToolbarMobile />);

    cy.get("#view-group").should("exist");
    cy.get("#search-group").should("exist");
  });

  it("shows correct icon for current view (default grid)", () => {
    cy.mount(() => <ToolbarMobile />);
    cy.get("#view-mode-button i").should("have.class", "bi-grid");
  });

  it("shows correct icon for current view (mosaic)", () => {
    cy.mount(() => <ToolbarMobile currentView="mosaic" />);
    cy.get("#view-mode-button i").should("have.class", "bi-grid-1x2");
  });

  it("shows correct icon for current view (map)", () => {
    cy.mount(() => <ToolbarMobile currentView="map" />);
    cy.get("#view-mode-button i").should("have.class", "bi-map");
  });

  it("shows correct icon for current view (mar)", () => {
    cy.mount(() => <ToolbarMobile currentView="mar" />);
    cy.get("#view-mode-button i").should("have.class", "bi-image");
  });

  it("emits open events when buttons are clicked", () => {
    const onOpenViewMenu = cy.stub().as("onOpenViewMenu");
    const onOpenSearchText = cy.stub().as("onOpenSearchText");
    const onOpenSearchColor = cy.stub().as("onOpenSearchColor");
    const onOpenSearchDate = cy.stub().as("onOpenSearchDate");

    cy.mount(() => (
      <ToolbarMobile
        onOpenViewMenu={onOpenViewMenu}
        onOpenSearchText={onOpenSearchText}
        onOpenSearchColor={onOpenSearchColor}
        onOpenSearchDate={onOpenSearchDate}
      />
    ));

    cy.get("#view-mode-button").click();
    cy.get("#search-text-button").click();
    cy.get("#search-color-button").click();
    cy.get("#search-date-button").click();

    cy.get("@onOpenViewMenu").should("have.been.calledOnce");
    cy.get("@onOpenSearchText").should("have.been.calledOnce");
    cy.get("@onOpenSearchColor").should("have.been.calledOnce");
    cy.get("@onOpenSearchDate").should("have.been.calledOnce");
  });
});
