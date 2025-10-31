describe("Alerts (Bootstrap styles)", () => {
  it("renderiza alerts", () => {
    cy.mount(() => (
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows: "repeat(3, 64px)",
          gridColumnGap: "72px",
          gridRowGap: "12px",
          alignItems: "stretch",
        }}
      >
        <div class="alert bg-negativo-e text-white fs-6" role="alert">
          <i class="bi bi-exclamation-triangle-fill" />
          Dados informados estão incorretos
          <button
            type="button"
            class="btn-close text-white"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>
        <div
          class="alert alert-danger bg-negativo-c fs-6 text-negativo-e  border border-danger border-start-3"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle-fill text-negativo-e" />
          Dados informados estão incorretos (light)
          <button
            type="button"
            class="btn-close text-negativo-e"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>

        <div class="alert bg-positivo-e text-white fs-6" role="alert">
          <i class="bi bi-check-all" />
          Success
          <button
            type="button"
            class="btn-close text-white"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>
        <div
          class="alert alert-success bg-positivo-c fs-6 text-positivo-e alert-light border border-success border-start-3"
          role="alert"
        >
          Success (light)
          <button
            type="button"
            class="btn-close text-positivo-e"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>

        <div class="alert bg-preto text-white fs-6" role="alert">
          <i class="bi bi-check-all" />
          Dark
          <button
            type="button"
            class="btn-close text-white"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>
        <div
          class="alert alert-dark bg-off-white alert-light border border-dark border-start-3"
          role="alert"
        >
          Dark (light)
          <button
            type="button"
            class="btn-close text-preto"
            data-bs-dismiss="alert"
            aria-label="Close"
          />
        </div>
      </div>
    ));
  });
});
