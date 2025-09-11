describe("Tabs (Bootstrap styles)", () => {
  it("renderiza tabs underline", () => {
    cy.mount(() => (
      <div style={{ width: "420px" }}>
        <ul class="nav nav-underline">
          <li class="nav-item">
            <button class="nav-link active" aria-current="page" data-label="Active">Active</button>
          </li>
          <li class="nav-item">
            <button class="nav-link" data-label="Link">Link</button>
          </li>
          <li class="nav-item">
            <button class="nav-link" data-label="Another link">Another link</button>
          </li>
          <li class="nav-item">
            <button class="nav-link" disabled data-label="Disabled">Disabled</button>
          </li>
        </ul>
      </div>
    ));
  });
});


