// ----- Config -----------------------------------------------------------
export const BACKGROUND_KEYS = {
  VERDE: "fundo-verde",
  AZUL: "fundo-azul",
  LARANJA: "fundo-laranja",
  ROSA: "fundo-rosa",
};

export const LINE_STYLES = {
  ANOS: "anos",
  DECADAS: "decadas",
  SECULOS: "seculos",
};

export const PROPORTION_BUCKETS = {
  BAIXA: "baixa",
  MEDIA: "media",
  ALTA: "alta",
};

const LINE_COUNT = 6;

const YEARS_THRESHOLD_DECADAS = 10;
const YEARS_THRESHOLD_SECULOS = 100;

// ----- Fundo --------------------------------------------------------------
// Decide qual fundo usar com base na quantidade de imagens no album
export function pickBackgroundKey(imageCount = 0) {
  if (imageCount <= 3) {
    return BACKGROUND_KEYS.VERDE;
  }

  if (imageCount <= 7) {
    return BACKGROUND_KEYS.AZUL;
  }

  if (imageCount <= 12) {
    return BACKGROUND_KEYS.LARANJA;
  }

  return BACKGROUND_KEYS.ROSA;
}

// ----- Período (date_range) -> estilo da linha -----------------------------
function toYear(value) {
  const year = Number(value);
  return Number.isFinite(year) ? year : null;
}

function extractYears(dateRange) {
  if (!dateRange) return null;

  const start = dateRange.from;
  const end = dateRange.to;

  if (start == null || end == null) return null;

  const startYear = toYear(start);
  const endYear = toYear(end);

  if (startYear == null || endYear == null) return null;

  return { startYear, endYear };
}

/**
 * @param {object|null} dateRange
 * @returns {number}
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
 * Relação tags/imagens conforme regra do design:
 * total_unique_tags <= total_images        -> baixa (até 1 tag por imagem)
 * total_unique_tags <= total_images * 5    -> media (até 5 tags por imagem)
 * total_unique_tags > total_images * 5     -> alta  (acima de 5 tags por imagem)
 * @param {number} totalUniqueTags stats.total_unique_tags
 * @param {number} totalImages stats.total_images
 * @returns {'baixa'|'media'|'alta'}
 */
export function getRelationBucket(totalUniqueTags = 0, totalImages = 0) {
  if (!totalImages) return PROPORTION_BUCKETS.BAIXA;
  if (totalUniqueTags < totalImages) return PROPORTION_BUCKETS.BAIXA;
  if (totalUniqueTags === totalImages * 5) return PROPORTION_BUCKETS.MEDIA;
  return PROPORTION_BUCKETS.ALTA;
}

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
 * @returns {number[]}
 */
export function getDotPositions(binomialAverages, lineCount) {
  if (!Array.isArray(binomialAverages) || binomialAverages.length === 0) {
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

  const backgroundKey = pickBackgroundKey(stats?.total_images);

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

  const bucket = getRelationBucket(stats.total_unique_tags, stats.total_images);
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
