describe("Buttons (Bootstrap styles)", () => {
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
        <div class="dropdown">
          <button
            type="button"
            class="btn btn-primary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Primary
          </button>
          <ul class="dropdown-menu menu-light">
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

        {/* Aberto (forçado com .show) com caret à esquerda (padrão - sem classe) */}
        <div class="dropdown show">
          <button
            class="btn btn-primary btn-icon dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            <i class="bi bi-sticky" /> Dropdown
          </button>
          <ul
            class="dropdown-menu menu-light show"
            style={{
              position: "static",
              transform: "none",
              display: "block",
            }}
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
            data-bs-toggle="dropdown"
          >
            <i class="bi bi-sticky" /> Dropdown
          </button>
          <ul class="dropdown-menu menu-dark show">
            <li>
              <button class="dropdown-item  active">Active</button>
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
          <button
            class="btn btn-primary btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            Small
          </button>
          <ul class="dropdown-menu menu-light">
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

        {/* Icon */}
        <div class="dropdown">
          <button
            class="btn btn-primary dropdown-toggle btn-icon caret-right"
            type="button"
            data-bs-toggle="dropdown"
          >
            <i class="bi bi-sticky" />
          </button>
          <ul class="dropdown-menu menu-dark">
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
