<template>
  <div class="guia-estilo-tokens">
    <p class="guia-estilo-tokens__modo" data-cy="guia-estilo-tokens-modo">
      Valores lidos do CSS desta tela, em modo
      <strong>{{ desktop ? "desktop (≥ 768px)" : "mobile (< 768px)" }}</strong
      >. Redimensione a janela para ver o outro modo.
    </p>

    <section
      v-for="grupo in GRUPOS"
      :key="grupo.id"
      class="guia-estilo-tokens__grupo"
      :data-cy="`guia-estilo-tokens-${grupo.id}`"
    >
      <header class="guia-estilo-tokens__grupo-cabecalho">
        <h2>{{ grupo.titulo }}</h2>
        <p>{{ grupo.descricao }}</p>
      </header>

      <ul class="guia-estilo-tokens__lista">
        <li
          v-for="item in grupo.itens"
          :key="item.nome || item.prefixo"
          class="guia-estilo-tokens__item"
        >
          <div
            v-if="grupo.tipo === 'cor'"
            class="guia-estilo-tokens__cor"
            :style="{ backgroundColor: `var(${item.nome})` }"
          />
          <div
            v-else-if="grupo.tipo === 'sombra'"
            class="guia-estilo-tokens__sombra"
            :style="{ boxShadow: `var(${item.nome})` }"
          />
          <div
            v-else-if="grupo.tipo === 'espaco'"
            class="guia-estilo-tokens__espaco"
            :style="{ width: `var(${item.nome})` }"
          />
          <p
            v-else-if="grupo.tipo === 'texto'"
            class="guia-estilo-tokens__texto"
            :style="estiloTexto(item)"
          >
            {{ item.exemplo }}
          </p>

          <div class="guia-estilo-tokens__info">
            <code>{{ item.nome || `${item.prefixo}-*` }}</code>
            <span v-if="item.figma" class="guia-estilo-tokens__figma">
              Figma: {{ item.figma }}
            </span>
            <span class="guia-estilo-tokens__valor">
              {{
                grupo.tipo === "texto" ? resumoTexto(item) : valor(item.nome)
              }}
            </span>
            <GuiaEstiloSelo v-if="item.selo" :tipo="item.selo" />
            <span v-if="item.nota" class="guia-estilo-tokens__nota">
              {{ item.nota }}
            </span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";
import GuiaEstiloSelo from "@/components/guiaEstilo/GuiaEstiloSelo.vue";

defineOptions({ name: "GuiaEstiloTokens" });

const GRUPOS = [
  {
    id: "cores",
    titulo: "Cores",
    tipo: "cor",
    descricao:
      "Variables do Figma. Escura (E): títulos e texto de qualquer tamanho. Média (M): figuras e texto maior que H1. Clara (C): fundo.",
    itens: [
      { nome: "--Preto", figma: "Preto" },
      { nome: "--Branco", figma: "Branco" },
      { nome: "--Off_white", figma: "Off_white" },
      { nome: "--Cinza_E", figma: "Cinza_E" },
      { nome: "--Cinza_M", figma: "Cinza_M" },
      { nome: "--Cinza_C", figma: "Cinza_C" },
      { nome: "--Laranja_E", figma: "Laranja_E" },
      { nome: "--Laranja_M", figma: "Laranja_M" },
      { nome: "--Laranja_C", figma: "Laranja_C" },
      { nome: "--Azul_E", figma: "Azul_E" },
      { nome: "--Azul_M", figma: "Azul_M" },
      { nome: "--Azul_C", figma: "Azul_C" },
      {
        nome: "--Positivo_E",
        figma: "Feedback/Positivo_E",
        selo: "diverge",
        nota: "No Figma: #356407",
      },
      {
        nome: "--Positivo_M",
        figma: "Feedback/Positivo_M",
        selo: "diverge",
        nota: "No Figma: #669d3b",
      },
      {
        nome: "--Positivo_C",
        figma: "Feedback/Positivo_C",
        selo: "diverge",
        nota: "No Figma: #e5f6d6",
      },
      { nome: "--Negativo_E", figma: "Feedback/Negativo_E" },
      {
        nome: "--Negativo_M",
        figma: "Feedback/Negativo_M",
        selo: "diverge",
        nota: "No Figma: #d80012",
      },
      {
        nome: "--Negativo_C",
        figma: "Feedback/Negativo_C",
        selo: "diverge",
        nota: "No Figma: #ffeaeb",
      },
      {
        nome: "--Gray-900",
        figma: "Gray/900 (biblioteca externa)",
        nota: "Cor dos textos H3 e parágrafo",
      },
    ],
  },
  {
    id: "tipografia",
    titulo: "Tipografia",
    tipo: "texto",
    descricao:
      "Estilos de texto do Figma, em DM Sans. Cada token troca de valor em 768px.",
    itens: [
      {
        prefixo: "--h1",
        figma: "H1/desk · H1/mobile",
        exemplo: "Título nível 1",
        cor: "--h1-color",
        selo: "diverge",
        nota: "Mobile no Figma: 20px (no código: 30px)",
      },
      {
        prefixo: "--h2",
        figma: "H2/desk · H2/mobile",
        exemplo: "Título nível 2",
        cor: "--h2-color",
      },
      {
        prefixo: "--h3",
        figma: "H3/desk · H3/mobile",
        exemplo: "Título nível 3",
        cor: "--h3-color",
        selo: "diverge",
        nota: "Mobile no Figma: 14px (no código: 16px)",
      },
      {
        prefixo: "--p",
        figma: "parágrafo/desk · parágrafo/mobile",
        exemplo: "Parágrafo de texto corrido.",
        cor: "--p-color",
        selo: "diverge",
        nota: "Mobile no Figma: 12px (no código: 14px)",
      },
      {
        prefixo: "--p-italico",
        figma: "parágrafo/Itálico_desk · Itálico_mobile",
        exemplo: "Parágrafo em itálico.",
        italico: true,
        nota: "No mobile, o Figma usa DM Sans 9pt",
      },
      {
        prefixo: "--btn-uni",
        figma: "botão/unico",
        exemplo: "Rótulo do botão",
        nove: true,
        nota: "DM Sans 9pt (--fonte-9pt), aplicado no UiButton",
      },
      {
        prefixo: "--entrada",
        figma: "EntradaDado/desk · EntradaDado/mobile",
        exemplo: "Texto digitado no campo",
      },
      {
        prefixo: "--placeholder",
        figma: "EntradaDado/placeholder_desk · placeholder_mobile",
        exemplo: "Texto de exemplo do campo",
        cor: "--placeholder-color",
        italico: true,
        selo: "diverge",
        nota: "O Figma usa DM Sans 9pt; os campos atuais usam o tamanho óptico automático",
      },
      {
        prefixo: "--rotulo",
        figma: "rótulo/desk · rótulo/mobile",
        exemplo: "Rótulo",
        nove: true,
      },
      {
        prefixo: "--menu-sel",
        figma: "menuPrincipal/Selec_desk · Selec_mobile",
        exemplo: "Menu selecionado",
        espacamentoLetras: true,
        selo: "diverge",
        nota: "Definido só no desktop; mobile no Figma: Bold 18px",
      },
      {
        prefixo: "--menu-nsel",
        figma: "menuPrincipal/NSelec_desk · NSelec_mobile",
        exemplo: "Menu não selecionado",
        espacamentoLetras: true,
      },
      {
        prefixo: "--submenu-sel",
        figma: "subMenu/Selec_desk · Selec_mobile",
        exemplo: "Submenu selecionado",
        selo: "diverge",
        nota: "Definido só no desktop; mobile no Figma: ExtraBold 14px/150%. O UiAbas usa --abas-sel-*",
      },
      {
        prefixo: "--submenu-nsel",
        figma: "subMenu/NSelec_desk · NSelec_mobile",
        exemplo: "Submenu não selecionado",
      },
    ],
  },
  {
    id: "sombras",
    titulo: "Sombras",
    tipo: "sombra",
    descricao:
      "Effect styles do Figma. Quando usar cada uma ainda não está definido.",
    itens: [
      { nome: "--Sombra_P", figma: "Sombra_P" },
      { nome: "--Sombra_G", figma: "Sombra_G" },
      { nome: "--shadow-elevation-low", selo: "fora" },
      { nome: "--shadow-elevation-medium", selo: "fora" },
      { nome: "--shadow-elevation-high", selo: "fora" },
    ],
  },
  {
    id: "espacamento",
    titulo: "Espaçamento",
    tipo: "espaco",
    descricao:
      "Escala de espaçamento do Figma (ppp a xxg). O item lista do LINA usa ppp, pp e p como padding.",
    itens: ["ppp", "pp", "p", "m", "g", "gg", "ggg", "xg", "xxg"].map(
      (passo) => ({ nome: `--espaco-${passo}`, figma: passo }),
    ),
  },
  {
    id: "grade",
    titulo: "Grid",
    tipo: "valor",
    descricao:
      "Grids do Figma: mobile com 6 colunas, desktop com 12. A troca em 768px é provisória.",
    itens: [
      { nome: "--grade-margem", figma: "grade_mobile 16 · grade_desktop 50" },
      { nome: "--grade-gutter", figma: "grade_mobile 16 · grade_desktop 20" },
    ],
  },
  {
    id: "foco",
    titulo: "Foco",
    tipo: "valor",
    descricao:
      "Padrão de foco do Design System para todo elemento interativo: contorno sólido em Laranja_E, afastado do elemento, só ao navegar pelo teclado (:focus-visible). Substitui o anel do Bootstrap, que quase não aparece sobre o branco.",
    itens: [
      { nome: "--foco-cor", figma: "Laranja_E" },
      { nome: "--foco-largura", figma: "espessura do contorno" },
      { nome: "--foco-afastamento", figma: "distância até o elemento" },
    ],
  },
  {
    id: "botao",
    titulo: "Botão e controles",
    tipo: "valor",
    descricao: "Medidas do Botão_p do Figma usadas pelo UiButton.",
    itens: [
      { nome: "--control-height-desk", figma: "Display=desk (altura)" },
      { nome: "--control-height-mobile", figma: "Display=mobile (altura)" },
      { nome: "--botao-gap", figma: "espaço entre ícone e texto" },
      { nome: "--botao-icone", figma: "tamanho do ícone" },
      { nome: "--botao-inativo-opacidade", figma: "Estado=inativo" },
      { nome: "--fonte-9pt", figma: "DM Sans 9pt" },
    ],
  },
  {
    id: "item-lista",
    titulo: "Item de lista",
    tipo: "valor",
    descricao: "Medidas do item lista do LINA usadas pelo UiItemLista.",
    itens: [
      { nome: "--item-lista-titulo-fs", figma: "Título (12 mobile · 14 desk)" },
      { nome: "--item-lista-titulo-fw", figma: "Título Bold" },
      { nome: "--item-lista-titulo-lh", figma: "Título 125%" },
      { nome: "--item-lista-imagem", figma: "avatar (30 mobile · 50 desk)" },
      { nome: "--item-lista-seta", figma: "arrow-right (12 mobile · 25 desk)" },
      { nome: "--item-lista-borda", figma: "linha inferior" },
    ],
  },
  {
    id: "abas",
    titulo: "Abas",
    tipo: "valor",
    descricao:
      "Medidas do item_tab_txt e do tab_horizontal_txt do LINA usadas pelo UiAbas. O espaço entre abas segue o Interfaces. A aba não selecionada usa --submenu-nsel-*.",
    itens: [
      { nome: "--abas-altura", figma: "item_tab_txt (altura)" },
      { nome: "--abas-linha", figma: "linha da aba selecionada" },
      { nome: "--abas-gap", figma: "espaço entre abas (12 mobile · 40 desk)" },
      {
        nome: "--abas-padding-vertical",
        figma: "tab_horizontal_txt (4 mobile · 0 desk)",
      },
      { nome: "--abas-sel-fs", figma: "subMenu/Selec (14 mobile · 20 desk)" },
      { nome: "--abas-sel-fw", figma: "ExtraBold mobile · Bold desk" },
      { nome: "--abas-sel-lh", figma: "150% mobile · 100% desk" },
    ],
  },
];

const desktop = useMediaQuery("(min-width: 768px)");

const nomesLidos = GRUPOS.flatMap((grupo) =>
  grupo.itens.flatMap((item) =>
    item.prefixo
      ? ["fs", "fw", "lh", "ls"].map((sufixo) => `${item.prefixo}-${sufixo}`)
      : [item.nome],
  ),
);

// Os valores só mudam no breakpoint, então `desktop` basta para reler o CSS.
const valores = computed(() => {
  void desktop.value;
  const estilos = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    nomesLidos.map((nome) => [nome, estilos.getPropertyValue(nome).trim()]),
  );
});

const valor = (nome) => valores.value[nome] || "não definido";

const resumoTexto = (item) => {
  const partes = ["fs", "fw", "lh"].map((sufixo) =>
    valor(`${item.prefixo}-${sufixo}`),
  );
  if (item.espacamentoLetras) partes.push(valor(`${item.prefixo}-ls`));
  return partes.join(" · ");
};

const estiloTexto = (item) => ({
  fontSize: `var(${item.prefixo}-fs)`,
  fontWeight: `var(${item.prefixo}-fw)`,
  lineHeight: `var(${item.prefixo}-lh)`,
  letterSpacing: item.espacamentoLetras ? `var(${item.prefixo}-ls)` : undefined,
  color: item.cor ? `var(${item.cor})` : undefined,
  fontStyle: item.italico ? "italic" : undefined,
  fontVariationSettings: item.nove ? "var(--fonte-9pt)" : undefined,
});
</script>

<style scoped>
.guia-estilo-tokens {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-xg);
}

.guia-estilo-tokens__modo {
  margin: 0;
  color: var(--Cinza_M);
}

.guia-estilo-tokens__grupo {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-m);
}

.guia-estilo-tokens__grupo-cabecalho h2,
.guia-estilo-tokens__grupo-cabecalho p {
  margin: 0;
}

.guia-estilo-tokens__grupo-cabecalho {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-ppp);
}

.guia-estilo-tokens__lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: var(--espaco-g);
  margin: 0;
  padding: 0;
  list-style: none;
}

.guia-estilo-tokens__item {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-pp);
}

.guia-estilo-tokens__cor,
.guia-estilo-tokens__sombra {
  width: var(--espaco-xxg);
  height: var(--espaco-xxg);
  border: var(--bs-border-width) solid var(--Cinza_C);
}

.guia-estilo-tokens__sombra {
  margin: var(--espaco-pp);
  border: 0;
  background-color: var(--Branco);
}

.guia-estilo-tokens__espaco {
  height: var(--espaco-p);
  background-color: var(--Laranja_M);
}

.guia-estilo-tokens__texto {
  margin: 0;
}

.guia-estilo-tokens__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--espaco-ppp);
  font-size: var(--rotulo-fs);
  line-height: var(--rotulo-lh);
}

.guia-estilo-tokens__info code {
  color: var(--Preto);
}

.guia-estilo-tokens__figma,
.guia-estilo-tokens__valor {
  color: var(--Cinza_M);
}

.guia-estilo-tokens__nota {
  color: var(--Cinza_E);
}
</style>
