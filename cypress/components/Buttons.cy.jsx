describe("Buttons (Bootstrap styles)", () => {
  it("renderiza variantes básicas", () => {
    cy.mount(() => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gridTemplateRows: "repeat(4, 64px)",
          gap: "12px",
          justifyItems: "center",
          alignItems: "center",
        }}
      >
        <button class="btn btn-primary">Primary</button>
        <button class="btn btn-outline-primary">Outline</button>
        <button class="btn btn-primary btn-icon">
          <i class="bi bi-sticky" /> Primary
        </button>
        <button class="btn btn-outline-primary btn-icon">
          <i class="bi bi-sticky" /> Outline
        </button>
        <button class="btn btn-primary">
          <i class="bi bi-sticky" />
        </button>
        <button class="btn btn-outline-primary ">
          <i class="bi bi-sticky" />
        </button>

        <button class="btn btn-primary" disabled>
          Primary
        </button>
        <button class="btn btn-outline-primary" disabled>
          Outline
        </button>
        <button class="btn btn-primary btn-icon" disabled>
          <i class="bi bi-sticky" /> Primary
        </button>
        <button class="btn btn-outline-primary btn-icon" disabled>
          <i class="bi bi-sticky" /> Outline
        </button>
        <button class="btn btn-primary" disabled>
          <i class="bi bi-sticky" />
        </button>
        <button class="btn btn-outline-primary" disabled>
          <i class="bi bi-sticky" />
        </button>

        <button class="btn btn-secondary">Secondary</button>
        <button class="btn btn-outline-secondary">Outline</button>
        <button class="btn btn-secondary btn-icon">
          <i class="bi bi-sticky" /> Secondary
        </button>
        <button class="btn btn-outline-secondary btn-icon">
          <i class="bi bi-sticky" /> Outline
        </button>
        <button class="btn btn-secondary">
          <i class="bi bi-sticky" />
        </button>
        <button class="btn btn-outline-secondary">
          <i class="bi bi-sticky" />
        </button>

        <button class="btn btn-secondary" disabled>
          Secondary
        </button>
        <button class="btn btn-outline-secondary" disabled>
          Outline
        </button>
        <button class="btn btn-secondary btn-icon" disabled>
          <i class="bi bi-sticky" /> Secondary
        </button>
        <button class="btn btn-outline-secondary btn-icon" disabled>
          <i class="bi bi-sticky" /> Outline
        </button>
        <button class="btn btn-secondary" disabled>
          <i class="bi bi-sticky" />
        </button>
        <button class="btn btn-outline-secondary" disabled>
          <i class="bi bi-sticky" />
        </button>
      </div>
    ));
  });

  it("renderiza variantes sm", () => {
    cy.mount(() => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gridTemplateRows: "repeat(4, 64px)",
          gap: "12px",
          justifyItems: "center",
          alignItems: "center",
        }}
      >
        <button class="btn btn-primary btn-sm">Primary</button>
        <button class="btn btn-outline-primary btn-sm">Outline</button>
        <button class="btn btn-primary btn-sm btn-icon">
          <i class="bi bi-sticky" /> Primary
        </button>
        <button class="btn btn-outline-primary btn-sm btn-icon">
          <i class="bi bi-sticky" /> Outline
        </button>
        <button class="btn btn-primary btn-sm">
          <i class="bi bi-sticky" />
        </button>
        <button class="btn btn-outline-primary btn-sm">
          <i class="bi bi-sticky" />
        </button>

        <button class="btn btn-primary btn-sm" disabled>
          Primary
        </button>
        <button class="btn btn-outline-primary btn-sm" disabled>
          Outline
        </button>
        <button class="btn btn-primary btn-sm btn-icon" disabled>
          <i class="bi bi-sticky" /> Primary
        </button>
        <button class="btn btn-outline-primary btn-sm btn-icon" disabled>
          <i class="bi bi-sticky" /> Outline
        </button>
        <button class="btn btn-primary btn-sm" disabled>
          <i class="bi bi-sticky" />
        </button>
        <button class="btn btn-outline-primary btn-sm" disabled>
          <i class="bi bi-sticky" />
        </button>

        <button class="btn btn-secondary btn-sm">Secondary</button>
        <button class="btn btn-outline-secondary btn-sm">Outline</button>
        <button class="btn btn-secondary btn-sm btn-icon">
          <i class="bi bi-sticky" /> Secondary
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon">
          <i class="bi bi-sticky" /> Outline
        </button>
        <button class="btn btn-secondary btn-sm">
          <i class="bi bi-sticky" />
        </button>
        <button class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-sticky" />
        </button>

        <button class="btn btn-secondary btn-sm" disabled>
          Secondary
        </button>
        <button class="btn btn-outline-secondary btn-sm" disabled>
          Outline
        </button>
        <button class="btn btn-secondary btn-sm btn-icon" disabled>
          <i class="bi bi-sticky" /> Secondary
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon" disabled>
          <i class="bi bi-sticky" /> Outline
        </button>
        <button class="btn btn-secondary btn-sm" disabled>
          <i class="bi bi-sticky" />
        </button>
        <button class="btn btn-outline-secondary btn-sm" disabled>
          <i class="bi bi-sticky" />
        </button>
      </div>
    ));
  });

  it("renderiza dropdowns", () => {
    cy.mount(() => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 280px)",
          gap: "16px",
          alignItems: "start",
          justifyItems: "start",
        }}
      >
        {/* Básico (fechado) */}
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-primary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Primary
          </button>
          <ul class="dropdown-menu">
            <li>
              <a class="dropdown-item" href="#">
                Action
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="#">
                Another action
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="#">
                Something else here
              </a>
            </li>
            <li>
              <hr class="dropdown-divider" />
            </li>
            <li>
              <a class="dropdown-item" href="#">
                Separated link
              </a>
            </li>
          </ul>
        </div>

        {/* Aberto (forçado com .show) com caret à esquerda (padrão - sem classe) */}
        <div class="dropdown show">
          <button
            class="btn btn-primary btn-icon dropdown-toggle"
            type="button"
          >
            <i class="bi bi-sticky" /> Dropdown
          </button>
          <ul
            class="dropdown-menu show"
            style={{ position: "static", transform: "none", display: "block" }}
          >
            <li>
              <button class="dropdown-item active">Active</button>
            </li>
            <li>
              <button class="dropdown-item">Item</button>
            </li>
            <li>
              <button class="dropdown-item" disabled>
                Disabled
              </button>
            </li>
            <li>
              <hr class="dropdown-divider" />
            </li>
            <li>
              <button class="dropdown-item">Separated link</button>
            </li>
          </ul>
        </div>

        {/* Split button com caret à direita */}
        <div class="dropdown show">
          <button
            class="btn btn-secondary btn-icon dropdown-toggle caret-right"
            type="button"
          >
            <i class="bi bi-sticky" /> Dropdown
          </button>
          <ul
            class="dropdown-menu show"
            style={{ position: "static", transform: "none", display: "block" }}
          >
            <li>
              <button class="dropdown-item active">Active</button>
            </li>
            <li>
              <button class="dropdown-item">Item</button>
            </li>
            <li>
              <button class="dropdown-item" disabled>
                Disabled
              </button>
            </li>
            <li>
              <hr class="dropdown-divider" />
            </li>
            <li>
              <button class="dropdown-item">Separated link</button>
            </li>
          </ul>
        </div>

        {/* Tamanho sm */}
        <div class="dropdown">
          <button class="btn btn-primary btn-sm dropdown-toggle" type="button">
            Small
          </button>
          <ul class="dropdown-menu">
            <li>
              <button class="dropdown-item">Item</button>
            </li>
            <li>
              <button class="dropdown-item">Item</button>
            </li>
          </ul>
        </div>

        {/* Outline e aberto */}
        <div class="dropdown show">
          <button class="btn btn-outline-primary dropdown-toggle" type="button">
            Outline
          </button>
          <ul
            class="dropdown-menu show"
            style={{ position: "static", transform: "none", display: "block" }}
          >
            <li>
              <button class="dropdown-item">Item</button>
            </li>
            <li>
              <button class="dropdown-item">Item</button>
            </li>
          </ul>
        </div>

        {/* Disabled */}
        <div class="dropdown">
          <button
            class="btn btn-outline-secondary dropdown-toggle"
            type="button"
            disabled
          >
            Disabled
          </button>
        </div>
      </div>
    ));
  });
});
