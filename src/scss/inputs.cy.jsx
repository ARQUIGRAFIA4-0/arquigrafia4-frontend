describe("Inputs (Bootstrap styles)", () => {
  it("renderiza inputs variados", () => {
    cy.mount(() => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "minmax(56px, auto)",
          gap: "16px",
          alignItems: "center",
        }}
      >
        {/* Text input default */}
        <input
          class="form-control"
          type="text"
          placeholder="Placeholder padrão"
        />

        {/* Text input sm */}
        <input
          class="form-control form-control-sm"
          type="text"
          placeholder="Tamanho sm"
        />

        {/* Text input disabled */}
        <input
          class="form-control"
          type="text"
          placeholder="Desabilitado"
          disabled
        />

        {/* Textarea */}
        <textarea
          class="form-control"
          rows="3"
          placeholder="Textarea com 3 linhas"
        />

        {/* Validações */}
        <div>
          <input
            class="form-control is-valid"
            type="text"
            placeholder="Válido"
            value="Ok"
          />
          <div class="valid-feedback" style={{ display: "block" }}>
            Tudo certo!
          </div>
        </div>
        <div>
          <input
            class="form-control is-invalid"
            type="text"
            placeholder="Inválido"
            value="Erro"
          />
          <div class="invalid-feedback" style={{ display: "block" }}>
            Campo obrigatório
          </div>
        </div>

        {/* Radios (inclui checked para aplicar estilos de inputs.scss) */}
        <div class="form-check">
          <input class="form-check-input" type="radio" name="rgrp" id="r1" />
          <label class="form-check-label" for="r1">
            Opção A
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            name="rgrp"
            id="r2"
            checked
          />
          <label class="form-check-label" for="r2">
            Opção B (checked)
          </label>
        </div>
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            name="rgrp2"
            id="r3"
            disabled
          />
          <label class="form-check-label" for="r3">
            Opção desabilitada
          </label>
        </div>
      </div>
    ));
  });
});
