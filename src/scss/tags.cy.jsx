describe("Tags (Bootstrap button-based)", () => {
  it("renderiza variantes de tags", () => {
    cy.mount(() => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 64px)",
          gap: "12px",
          justifyItems: "center",
          alignItems: "center",
        }}
      >
        {/* Linha 1: Estados normais */}
        <button class="btn btn-secondary btn-sm btn-tag">
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close btn-close-white ms-2"
            aria-label="Remover"
          />
        </button>

        <button class="btn btn-info btn-sm btn-tag">
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close ms-2"
            aria-label="Remover"
          />
        </button>

        <button class="btn btn-outline-secondary btn-sm btn-tag">
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close ms-2"
            aria-label="Remover"
          />
        </button>

        {/* Linha 2: Estados disabled */}
        <button class="btn btn-secondary btn-sm btn-tag" disabled>
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close btn-close-white ms-2"
            aria-label="Remover"
            disabled
          />
        </button>

        <button class="btn btn-info btn-sm btn-tag" disabled>
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close ms-2"
            aria-label="Remover"
            disabled
          />
        </button>

        <button class="btn btn-outline-secondary btn-sm btn-tag" disabled>
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close ms-2"
            aria-label="Remover"
            disabled
          />
        </button>

        {/* Linha 3: Estados primary */}
        <button class="btn btn-primary btn-tag">
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close btn-close-white ms-2"
            aria-label="Remover"
          />
        </button>

        <button class="btn btn-outline-primary btn-tag">
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close ms-2"
            aria-label="Remover"
          />
        </button>

        <button class="btn btn-primary btn-tag" disabled>
          Autoria: <strong>Pietro Maria Bardi</strong>
          <button
            type="button"
            class="btn-close btn-close-white ms-2"
            aria-label="Remover"
            disabled
          />
        </button>
      </div>
    ));
  });
});

