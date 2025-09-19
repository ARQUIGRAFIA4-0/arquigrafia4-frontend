describe("Range (Bootstrap styles)", () => {
  it("renderiza ranges em 5 tipos e 2 tamanhos (default e sm)", () => {
    cy.mount(() => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 320px)",
          gridTemplateRows: "repeat(5, 80px)",
          gap: "16px",
          alignItems: "center",
        }}
      >
        {/* Hue */}
        <input
          type="range"
          class="form-range form-range-hue"
          min="0"
          max="360"
          value="200"
        />
        <input
          type="range"
          class="form-range form-range-sm form-range-hue"
          min="0"
          max="360"
          value="200"
        />

        {/* Saturation */}
        <input
          type="range"
          class="form-range form-range-saturation"
          min="0"
          max="100"
          value="50"
        />
        <input
          type="range"
          class="form-range form-range-sm form-range-saturation"
          min="0"
          max="100"
          value="50"
        />

        {/* Lightness */}
        <input
          type="range"
          class="form-range form-range-lightness"
          min="0"
          max="100"
          value="50"
        />
        <input
          type="range"
          class="form-range form-range-sm form-range-lightness"
          min="0"
          max="100"
          value="50"
        />

        {/* Primary */}
        <input
          type="range"
          class="form-range form-range-primary"
          min="0"
          max="100"
          value="50"
        />
        <input
          type="range"
          class="form-range form-range-sm form-range-primary"
          min="0"
          max="100"
          value="50"
        />

        {/* Secondary (dual-thumb) */}
        <div
          class="form-range-dual form-range-primary"
          style={{ "--min": "10%", "--max": "90%" }}
        >
          {/* Lower bound */}
          <input
            type="range"
            class="form-range"
            min="0"
            max="100"
            value="10"
          />
          {/* Upper bound */}
          <input
            type="range"
            class="form-range"
            min="0"
            max="100"
            value="90"
          />
        </div>
        <div
          class="form-range-dual form-range-sm form-range-primary"
          style={{ "--min": "30%", "--max": "60%" }}
        >
          <input
            type="range"
            class="form-range"
            min="0"
            max="100"
            value="30"
          />
          <input
            type="range"
            class="form-range"
            min="0"
            max="100"
            value="60"
          />
        </div>

      </div>
    ));
  });
});


