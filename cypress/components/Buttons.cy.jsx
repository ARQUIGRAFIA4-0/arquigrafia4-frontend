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
});
