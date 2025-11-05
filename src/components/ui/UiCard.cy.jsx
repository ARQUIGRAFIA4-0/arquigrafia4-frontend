import { defineComponent, h } from "vue";
import UiCard from "./UiCard.vue";

describe("<UiCard />", () => {
  it("renderiza com conteúdo personalizado no slot padrão", () => {
    cy.mount(() => (
      <UiCard>
        <div class="ui-card__header">
          <h3 class="ui-card__title h3 text-cinza-e">Título</h3>
          <p class="ui-card__subtitle text-cinza-m">Subtítulo</p>
        </div>
        <p>Conteúdo principal</p>
        <a href="#">link</a>
      </UiCard>
    ));

    cy.contains("h3", "Título").should("be.visible");
    cy.contains("p", "Subtítulo").should("be.visible");
    cy.contains("p", "Conteúdo principal").should("be.visible");
    cy.contains("a", "link").should("have.attr", "href", "#");
  });

  it("suporta slot de imagem", () => {
    cy.mount(() => (
      <UiCard>
        {{
          image: () => (
            <img
              alt="Vista"
              src="https://picsum.photos/400/300"
              style="display: block; width: 100%; height: auto"
            />
          ),
        }}
      </UiCard>
    ));

    cy.get("img[alt='Vista']").should("be.visible");
  });

  it("renderiza rodapé customizado", () => {
    const Wrapper = defineComponent({
      name: "UiCardFooterWrapper",
      setup() {
        return () =>
          h(
            UiCard,
            {},
            {
              default: () => h("p", null, "Conteúdo principal"),
              footer: () => [
                h(
                  "button",
                  { class: "btn btn-outline-secondary w-100" },
                  "Rótulo"
                ),
                h("button", { class: "btn btn-dark w-100" }, "Rótulo"),
              ],
            }
          );
      },
    });

    cy.mount(Wrapper);

    cy.get(".ui-card__footer button").should("have.length", 2);
  });

  it("aplica estado ativo com estilização correspondente", () => {
    cy.mount(() => (
      <UiCard state="active">
        <h3>Título ativo</h3>
        <p>Conteúdo</p>
      </UiCard>
    ));

    cy.get(".ui-card")
      .should("have.class", "ui-card--active")
      .and("have.css", "background-color", "rgb(246, 221, 198)");
  });

  it("aplica estado inativo com aria-disabled", () => {
    cy.mount(() => (
      <UiCard state="inactive">
        <h3>Título inativo</h3>
        <p>Conteúdo</p>
      </UiCard>
    ));

    cy.get(".ui-card")
      .should("have.class", "ui-card--inactive")
      .and("have.attr", "aria-disabled", "true");
  });

  it("exibe grade com estados completo e sem rodapé", () => {
    const cardProps = [
      { state: "neutral", title: "Título", subtitle: "Subtítulo" },
      { state: "active", title: "Título ativo", subtitle: "Subtítulo" },
      { state: "inactive", title: "Título inativo", subtitle: "Subtítulo" },
    ];

    const Wrapper = defineComponent({
      name: "UiCardGalleryWrapper",
      setup() {
        return () =>
          h(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(3, 280px)",
                gridTemplateRows: "repeat(2, auto)",
                gap: "16px",
              },
            },
            [
              ...cardProps.map(({ state, title, subtitle }, index) =>
                h(
                  UiCard,
                  { state },
                  {
                    image: () =>
                      h("img", {
                        alt: `Vista ${index + 1}`,
                        src: `https://picsum.photos/seed/${state}/300/180`,
                        style: "display: block; width: 100%; height: auto",
                      }),
                    default: () => [
                      h("div", { class: "ui-card__header" }, [
                        h(
                          "h3",
                          { class: "ui-card__title h3 text-cinza-e" },
                          title
                        ),
                        h(
                          "p",
                          { class: "ui-card__subtitle text-cinza-m" },
                          subtitle
                        ),
                      ]),
                      h("p", { class: "mb-0" }, "Conteúdo principal"),
                      h(
                        "a",
                        { href: "#", class: "text-decoration-none" },
                        "link"
                      ),
                    ],
                    footer: () => [
                      h(
                        "button",
                        { class: "btn btn-outline-secondary w-100" },
                        "Rótulo"
                      ),
                      h("button", { class: "btn btn-dark w-100" }, "Rótulo"),
                    ],
                  }
                )
              ),
              ...cardProps.map(({ state, title, subtitle }, index) =>
                h(
                  UiCard,
                  { state },
                  {
                    image: () =>
                      h("img", {
                        alt: `Vista ${index + 4}`,
                        src: `https://picsum.photos/seed/${state}-no-footer/300/180`,
                        style: "display: block; width: 100%; height: auto",
                      }),
                    default: () => [
                      h("div", { class: "ui-card__header" }, [
                        h(
                          "h3",
                          { class: "ui-card__title h3 text-cinza-e" },
                          title
                        ),
                        h(
                          "p",
                          { class: "ui-card__subtitle text-cinza-m" },
                          subtitle
                        ),
                      ]),
                      h("p", { class: "mb-0" }, "Conteúdo principal"),
                      h(
                        "a",
                        { href: "#", class: "text-decoration-none" },
                        "link"
                      ),
                    ],
                  }
                )
              ),
            ]
          );
      },
    });

    cy.mountWithViewport(Wrapper, {}, { width: 1024, height: 900 });

    cy.get(".ui-card").should("have.length", 6);
    cy.get(".ui-card").eq(0).should("not.have.class", "ui-card--active");
    cy.get(".ui-card").eq(0).should("not.have.class", "ui-card--inactive");
    cy.get(".ui-card").eq(1).should("have.class", "ui-card--active");
    cy.get(".ui-card").eq(2).should("have.class", "ui-card--inactive");
    cy.get(".ui-card").eq(3).should("not.have.class", "ui-card--active");
    cy.get(".ui-card").eq(3).should("not.have.class", "ui-card--inactive");
    cy.get(".ui-card").eq(4).should("have.class", "ui-card--active");
    cy.get(".ui-card").eq(5).should("have.class", "ui-card--inactive");
    cy.get(".ui-card__media img").should("have.length", 6);
    cy.get(".ui-card__body a").should("have.length", 6);
    cy.get(".ui-card__footer").should("have.length", 3);
    cy.get(".ui-card__footer button").should("have.length", 6);
    cy.get(".ui-card").eq(3).find(".ui-card__footer").should("not.exist");
    cy.get(".ui-card").eq(4).find(".ui-card__footer").should("not.exist");
    cy.get(".ui-card").eq(5).find(".ui-card__footer").should("not.exist");
  });
});
