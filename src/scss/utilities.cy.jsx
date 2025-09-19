describe("Utilities (Design System)", () => {
  it("renderiza cores de background, texto e borda", () => {
    cy.mount(() => {
      const tokens = [
        "azul-e",
        "azul-m",
        "azul-c",
        "laranja-e",
        "laranja-m",
        "laranja-c",
        "cinza-e",
        "cinza-m",
        "cinza-c",
        "positivo-e",
        "positivo-m",
        "positivo-c",
        "negativo-e",
        "negativo-m",
        "negativo-c",
        "preto",
        "off-white",
        "branco",
      ];

      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* Background colors */}
          {tokens.map((token) => (
            <div
              key={`bg-${token}`}
              class={`bg-${token}`}
              data-label={`bg-${token}`}
              style={{
                height: "48px",
                borderRadius: "6px",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <span
                style={{
                  background: "rgba(255,255,255,0.6)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >{`bg-${token}`}</span>
            </div>
          ))}

          {/* Text colors */}
          {tokens.map((token) => (
            <div
              key={`text-${token}`}
              data-label={`text-${token}`}
              style={{
                height: "48px",
                borderRadius: "6px",
                display: "grid",
                placeItems: "center",
                background: "var(--Branco)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <span class={`text-${token}`}>{`text-${token}`}</span>
            </div>
          ))}

          {/* Border colors */}
          {tokens.map((token) => (
            <div
              key={`border-${token}`}
              class={`border-${token}`}
              data-label={`border-${token}`}
              style={{
                height: "48px",
                borderRadius: "6px",
                display: "grid",
                placeItems: "center",
                background: "var(--Branco)",
                borderStyle: "solid",
                borderWidth: "2px",
              }}
            >
              {`border-${token}`}
            </div>
          ))}
        </div>
      );
    });
  });

  it("renderiza larguras de borda (start, end, top, bottom)", () => {
    cy.mount(() => {
      const scales = [1, 2, 3, 4, 5];
      const directions = [
        { key: "start", style: { borderInlineStartStyle: "solid" } },
        { key: "end", style: { borderInlineEndStyle: "solid" } },
        { key: "top", style: { borderTopStyle: "solid" } },
        { key: "bottom", style: { borderBottomStyle: "solid" } },
      ];

      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 160px)",
            gap: "12px",
          }}
        >
          {directions.map((dir) => (
            <div
              key={dir.key}
              style={{ gridColumn: "1 / -1", fontWeight: 600 }}
            >
              {`border-${dir.key} (1..5)`}
            </div>
          ))}
          {directions.flatMap((dir) =>
            scales.map((s) => (
              <div
                key={`${dir.key}-${s}`}
                class={`border-${dir.key}-${s}`}
                data-label={`border-${dir.key}-${s}`}
                style={{
                  height: "48px",
                  borderRadius: "6px",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--Branco)",
                  borderColor: "var(--Cinza_C)",
                  ...dir.style,
                }}
              >
                {`border-${dir.key}-${s}`}
              </div>
            ))
          )}
        </div>
      );
    });
  });
});
