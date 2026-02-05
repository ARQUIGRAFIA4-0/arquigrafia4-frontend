export const CC_LICENSES = [
  {
    label: "BY",
    url: "https://creativecommons.org/licenses/by/4.0/",
    image: "logo_CC-BY.png",
    text: "Esta imagem pode ser copiada, redistribuida, e adaptada (o que inclui: remixar, transformar, e criar a partir do material), e utilizada para fins comerciais.<br><br>No entanto, <strong>você deve dar o crédito apropriado.</strong>",
  },
  {
    label: "BY-NC",
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
    image: "logo_CC-BY-NC.png",
    text: "Esta imagem pode ser copiada, redistribuida, e adaptada (o que inclui: remixar, transformar, e criar a partir do material), no entanto, <strong>você deve dar o crédito apropriado</strong>.<br><br>Esta imagem <span style='color: #BC1518;'><strong>não pode ser utilizada para fins comerciais.</strong></span>",
  },
  {
    label: "BY-NC-ND",
    url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    image: "logo_CC-BY-NC-ND.png",
    text: "Esta imagem pode ser copiada, redistribuída, desde que em sua forma original <span style='color: #BC1518;'><strong>(não pode ser alterada ou remixada).</strong></span><br><br><strong>Você deve dar o crédito apropriado.</strong><br><br>Esta imagem <span style='color: #BC1518;'><strong>não pode ser utilizada para fins comerciais.</strong></span>",
  },
  {
    label: "BY-NC-SA",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    image: "logo_CC-BY-NC-SA.png",
    text: "Esta imagem pode ser copiada, redistribuida, e adaptada (o que inclui: remixar, transformar, e criar a partir do material), no entanto, <strong>você deve dar o crédito apropriado</strong>, prover um link para <strong>o mesmo tipo de licença</strong> e indicar se mudanças foram feitas.<br><br>Esta imagem <span style='color: #BC1518;'><strong>não pode ser utilizada para fins comerciais.</strong></span>",
  },
  {
    label: "BY-ND",
    url: "https://creativecommons.org/licenses/by-nd/4.0/",
    image: "logo_CC-BY-ND.png",
    text: "Esta imagem pode ser copiada, redistribuída, e utilizada para fins comerciais, desde que em sua forma original <span style='color: #BC1518;'><strong>(não pode ser alterada ou remixada).</strong></span><br><br>No entanto, <strong>você deve dar o crédito apropriado</strong>.",
  },
  {
    label: "BY-SA",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
    image: "logo_CC-BY-SA.png",
    text: "Esta imagem pode ser copiada, redistribuída, e adaptada (o que inclui: remixar, transformar, e criar a partir do material), e utilizada para fins comerciais.<br><br>No entanto, <strong>você deve dar o crédito apropriado</strong>, prover um link para <strong>o mesmo tipo de licença</strong>, e indicar se mudanças foram feitas.",
  },
  {
    label: "CC0",
    url: "https://creativecommons.org/public-domain/cc0/",
    image: "logo_CC0.png",
    text: "Esta obra está em domínio público mundial. A imagem pode ser reutilizada, distribuída, remixada, adaptada e utilizada para criação de obras derivadas.",
  },
];

/**
 * Normaliza uma URL de licença Creative Commons removendo variações de locale
 * @param {string} url - URL da licença
 * @returns {string} URL normalizada
 */
const normalizeLicenseUrl = (url) => {
  if (!url) return "";
  
  // Remove trailing slash e variações de locale (deed.pt-br, deed.pt, etc)
  return url
    .replace(/\/+$/, "") // Remove trailing slashes
    .replace(/\/deed\.[a-z]{2}(-[a-z]{2})?$/i, ""); // Remove /deed.pt-br, /deed.pt, etc
};

/**
 * Encontra a licença Creative Commons baseada na URL
 * @param {string} url - URL da licença
 * @returns {Object|null} Objeto da licença ou null se não encontrada
 */
export const findLicenseByUrl = (url) => {
  if (!url) return null;
  
  const normalizedUrl = normalizeLicenseUrl(url);
  
  return CC_LICENSES.find((license) => {
    const normalizedLicenseUrl = normalizeLicenseUrl(license.url);
    return normalizedLicenseUrl === normalizedUrl;
  }) || null;
};