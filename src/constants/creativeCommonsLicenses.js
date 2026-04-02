/**
 * Dados estáveis por licença CC (URL oficial + arquivo do logo em `src/assets/`).
 * Texto e layout ficam em `src/components/imageDetail/license-contents/`.
 */
export const CC_LICENSES = [
  {
    label: "BY",
    url: "https://creativecommons.org/licenses/by/4.0/",
    image: "logo_CC-BY.png",
  },
  {
    label: "BY-NC",
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
    image: "logo_CC-BY-NC.png",
  },
  {
    label: "BY-NC-ND",
    url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    image: "logo_CC-BY-NC-ND.png",
  },
  {
    label: "BY-NC-SA",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    image: "logo_CC-BY-NC-SA.png",
  },
  {
    label: "BY-ND",
    url: "https://creativecommons.org/licenses/by-nd/4.0/",
    image: "logo_CC-BY-ND.png",
  },
  {
    label: "BY-SA",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
    image: "logo_CC-BY-SA.png",
  },
  {
    label: "CC0",
    url: "https://creativecommons.org/public-domain/cc0/",
    image: "logo_CC0.png",
  },
];

/**
 * Normaliza uma URL de licença Creative Commons removendo variações de locale
 * @param {string} url - URL da licença
 * @returns {string} URL normalizada
 */
const normalizeLicenseUrl = (url) => {
  if (!url) return "";

  return url
    .replace(/\/+$/, "")
    .replace(/\/deed\.[a-z]{2}(-[a-z]{2})?$/i, "");
};

/**
 * Encontra a licença Creative Commons baseada na URL
 * @param {string} url - URL da licença
 * @returns {Object|null} Objeto da licença ou null se não encontrada
 */
export const findLicenseByUrl = (url) => {
  if (!url) return null;

  const normalizedUrl = normalizeLicenseUrl(url);

  return (
    CC_LICENSES.find((license) => {
      const normalizedLicenseUrl = normalizeLicenseUrl(license.url);
      return normalizedLicenseUrl === normalizedUrl;
    }) || null
  );
};
