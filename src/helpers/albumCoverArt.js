/**
 * albumCoverArt.js
 * -----------------------------------------------------------------------
 * Lógica pura (sem Vue) para gerar os parâmetros da capa dinâmica de um
 * álbum a partir do objeto `stats` retornado por GET /users/{user}/albums.
 *
 * A capa é composta por:
 *   1. Um fundo sólido (1 de 4 assets fixos: laranja / azul / verde / rosa)
 *   2. Um asset de LINHAS pronto (@/assets/linhas-*.png), escolhido por:
 *        - ESTILO (anos / décadas / séculos) = período coberto pelas fotos
 *          do álbum (date_range)
 *        - BALDE (baixa / média / alta) = proporção de imagens com tags
 *          do álbum (tag_distribution). Existe também uma variante sem
 *          balde (ex: `linhas-anos.png`), usada como fallback.
 *   3. Um ponto (bolinha) por linha (sempre 5 linhas, confirmado com o
 *      design), desenhado por código (SVG) por cima do asset de linhas,
 *      sentado logo ACIMA de cada linha (como letra em cima da pauta de
 *      um caderno). Posição horizontal = média dos binômios daquela
 *      "faixa" (binomial_averages).
 *
 * As linhas em si NÃO são mais desenhadas por código — usamos os assets
 * prontos do design (12 arquivos: 3 estilos x [3 baldes + 1 fallback]).
 * Só os pontos, que carregam dado real da coleção, são gerados.
 *
 * Mantido como funções puras para poder ser testado isoladamente e
 * reaproveitado fora de componentes Vue se necessário.
 * -----------------------------------------------------------------------
 */

// ----- Config -----------------------------------------------------------

// Nomes dos assets de fundo já existentes no projeto (@/assets/fundo-*.png)
export const BACKGROUND_KEYS = {
  VERDE: "fundo-verde",
  AZUL: "fundo-azul",
  LARANJA: "fundo-laranja",
  ROSA: "fundo-rosa",
};

export const LINE_STYLES = {
  ANOS: "anos", // reta
  DECADAS: "decadas", // onda suave (1 ciclo)
  SECULOS: "seculos", // onda fechada (mais de 1 ciclo, mais "apertada")
};

export const PROPORTION_BUCKETS = {
  BAIXA: "baixa",
  MEDIA: "media",
  ALTA: "alta",
};

/**
 * Confirmado com o design: todo asset `linhas-{estilo}-{balde}.png` (e a
 * variante sem balde) tem sempre 5 linhas, igualmente espaçadas — o balde
 * (baixa/média/alta) muda o estilo do asset, não a quantidade de linhas.
 * Usado só para saber quantos pontos desenhar por cima.
 */
const LINE_COUNT = 6;

// Limites de anos para decidir o estilo da linha
const YEARS_THRESHOLD_DECADAS = 10; // >= 10 anos de intervalo -> onda suave
const YEARS_THRESHOLD_SECULOS = 100; // >= 100 anos de intervalo -> onda fechada

// ----- Fundo --------------------------------------------------------------

export function pickBackgroundKey(imageCount = 0) {
  if (imageCount <= 5) {
    return BACKGROUND_KEYS.VERDE;
  }

  if (imageCount <= 10) {
    return BACKGROUND_KEYS.AZUL;
  }

  if (imageCount <= 20) {
    return BACKGROUND_KEYS.LARANJA;
  }

  return BACKGROUND_KEYS.ROSA;
}

// ----- Período (date_range) -> estilo da linha -----------------------------

/**
 * Converte um valor de ano vindo do backend para número. O formato
 * confirmado é um ano puro (ex: 1998), não uma data completa — então NÃO
 * dá pra usar `new Date(value).getFullYear()` (isso trataria 1998 como
 * timestamp em ms, virando ano 1970). Aceita também string de ano
 * ("1998") e, por segurança, uma data completa caso o contrato mude.
 */
function toYear(value) {
  if (typeof value === "number") return value;

  const asNumber = Number(value);
  const looksLikeYear =
    typeof value === "string" && /^-?\d{1,4}$/.test(value.trim());
  if (looksLikeYear && !Number.isNaN(asNumber)) return asNumber;

  const parsedDate = new Date(value);
  const year = parsedDate.getFullYear();
  return Number.isNaN(year) ? null : year;
}

/**
 * Normaliza `date_range` vindo do backend. Formato confirmado da API:
 * `{ from, to }` com anos numéricos (ex: `{ from: 1520, to: 1900 }`).
 * Mantém suporte a outros formatos possíveis ({start,end} | {min,max} |
 * [start,end]) como fallback, caso o contrato mude.
 */
function extractYears(dateRange) {
  if (!dateRange) return null;

  const start =
    dateRange.from ?? dateRange.start ?? dateRange.min ?? dateRange[0] ?? null;
  const end =
    dateRange.to ?? dateRange.end ?? dateRange.max ?? dateRange[1] ?? null;
  if (start == null || end == null) return null;

  const startYear = toYear(start);
  const endYear = toYear(end);
  if (startYear == null || endYear == null) return null;

  return { startYear, endYear };
}

/**
 * @param {object|null} dateRange stats.date_range vindo da API
 * @returns {number} intervalo em anos coberto pelo álbum (0 se não houver dados)
 */
export function getDateSpanYears(dateRange) {
  const years = extractYears(dateRange);
  if (!years) return 0;
  return Math.abs(years.endYear - years.startYear);
}

/**
 * Decide o estilo de linha a partir do intervalo de anos coberto pelo álbum.
 * - poucos anos dentro da mesma década -> reta
 * - dentro de décadas (>= 10 anos)     -> onda suave
 * - abrange séculos (>= 100 anos)      -> onda fechada
 * @param {number} spanYears
 * @returns {'anos'|'decadas'|'seculos'}
 */
export function getLineStyle(spanYears) {
  if (spanYears >= YEARS_THRESHOLD_SECULOS) return LINE_STYLES.SECULOS;
  if (spanYears >= YEARS_THRESHOLD_DECADAS) return LINE_STYLES.DECADAS;
  return LINE_STYLES.ANOS;
}

// ----- Proporção tag/imagem -> quantidade de linhas -------------------------

/**
 * tag_distribution classifica cada imagem do álbum num balde conforme a
 * quantidade de tags que ela tem (up_to_2 / between_3_and_5 / more_than_5).
 * Quanto mais imagens caem nos baldes "com mais tags", maior a proporção
 * retornada (0 a 1).
 * @param {object} stats stats do álbum (contém total_images e tag_distribution)
 * @returns {number} proporção normalizada entre 0 e 1
 */
export function getTaggedProportion(stats) {
  const totalImages = stats?.total_images ?? 0;
  if (!totalImages) return 0;

  const {
    up_to_2 = 0,
    between_3_and_5 = 0,
    more_than_5 = 0,
  } = stats?.tag_distribution ?? {};

  // peso maior para imagens com mais tags associadas
  const weightedSum = up_to_2 * 1 + between_3_and_5 * 2 + more_than_5 * 3;
  const maxPossible = totalImages * 3;

    if (!maxPossible) return 0;
  return Math.min(1, weightedSum / maxPossible);
}

/**
 * Converte a proporção (0-1) num dos 3 baldes do design: baixa / média / alta.
 * @param {number} proportion
 * @returns {'baixa'|'media'|'alta'}
 */
export function getProportionBucket(proportion) {
  const clamped = Math.min(1, Math.max(0, proportion));
  if (clamped < 1 / 3) return PROPORTION_BUCKETS.BAIXA;
  if (clamped < 2 / 3) return PROPORTION_BUCKETS.MEDIA;
  return PROPORTION_BUCKETS.ALTA;
}

// export function getRelationBucket(totalTags = 0, totalImages = 0) {
//   if (!totalImages) {
//     return PROPORTION_BUCKETS.BAIXA;
//   }

//   if (totalTags < totalImages) {
//     return PROPORTION_BUCKETS.BAIXA;
//   }

//   if (totalTags === totalImages) {
//     return PROPORTION_BUCKETS.MEDIA;
//   }

//   return PROPORTION_BUCKETS.ALTA;
// }

/**
 * Monta a chave do asset de linhas pronto (@/assets/linhas-{estilo}-{balde}.png).
 * Se `bucket` for null/undefined, retorna a variante sem balde (fallback),
 * ex: `linhas-anos.png`.
 * @param {'anos'|'decadas'|'seculos'} lineStyle
 * @param {'baixa'|'media'|'alta'|null} bucket
 * @returns {string}
 */
export function getLinesAssetKey(lineStyle, bucket) {
  return bucket ? `linhas-${lineStyle}-${bucket}` : `linhas-${lineStyle}`;
}

// ----- Binômios -> posição dos pontos ---------------------------------------

/**
 * Formato confirmado de cada item de `binomial_averages`:
 *   { id, word_left, word_right, order, average }
 * onde `average` é uma string numérica numa escala FIXA de 0 a 100 —
 * 0 = totalmente `word_left`, 100 = totalmente `word_right`. Cada
 * binômio já carrega seu próprio mínimo e máximo (as duas palavras
 * opostas); é essa relação que a peça "desenho de mínimo e máximo dos
 * binômios" do guia visual representa. Por isso a posição do ponto usa
 * a média diretamente (average / 100), sem normalizar contra os outros
 * binômios da coleção.
 * @param {{average: string|number, order?: number}[]|number[]} binomialAverages stats.binomial_averages
 * @param {number} lineCount
 * @returns {number[]} array de tamanho `lineCount` com valores 0-1
 */
export function getDotPositions(binomialAverages, lineCount) {
  if (!Array.isArray(binomialAverages) || binomialAverages.length === 0) {
    // sem dado suficiente: centraliza os pontos
    return Array.from({ length: lineCount }, () => 0.5);
  }

  // aceita tanto o formato confirmado (objetos com `average`/`order`)
  // quanto um array simples de números, por segurança
  const values = [...binomialAverages]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((item) => {
      const raw =
        typeof item === "object" && item !== null ? item.average : item;
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : 50; // 50 = posição neutra
    });

  return Array.from({ length: lineCount }, (_, index) => {
    const sourceIndex = Math.min(
      values.length - 1,
      Math.floor((index / lineCount) * values.length),
    );
    const average = values[sourceIndex];
    return Math.min(1, Math.max(0, average / 100));
  });
}

// ----- API principal ---------------------------------------------------------

/**
 * Calcula todos os parâmetros necessários para desenhar a capa dinâmica
 * de um álbum a partir do payload retornado por GET /users/{user}/albums.
 * @param {object} album objeto de álbum vindo da API
 * @returns {{
 *   backgroundKey: string,
 *   linesAssetKey: string,
 *   lineCount: number,
 *   dotPositions: number[],
 *   hasContent: boolean,
 * }}
 */
export function getAlbumCoverArt(album) {
  const stats = album?.stats ?? null;
  
  const hasContent = Boolean(stats?.total_images);

  const backgroundKey = pickBackgroundKey(stats?.total_images)

  if (!hasContent) {
    // álbum vazio: só o fundo, sem asset de linhas nem pontos
    return {
      backgroundKey,
      linesAssetKey: null,
      lineCount: 0,
      dotPositions: [],
      hasContent,
    };
  }

  const spanYears = getDateSpanYears(stats.date_range);
  const lineStyle = getLineStyle(spanYears);

  const proportion = getTaggedProportion(stats);
  const bucket = getProportionBucket(proportion);
  const linesAssetKey = getLinesAssetKey(lineStyle, bucket);

  const dotPositions = getDotPositions(stats.binomial_averages, LINE_COUNT);

  return {
    backgroundKey,
    linesAssetKey,
    lineCount: LINE_COUNT,
    dotPositions,
    hasContent,
  };
}
