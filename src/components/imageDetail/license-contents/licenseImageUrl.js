/**
 * URL do logo CC em `src/assets/` a partir de `licenseInfo.image` (ex.: logo_CC-BY.png).
 * Caminho relativo a este arquivo: license-contents → imageDetail → components → src → assets
 */
export function getLicenseImageUrl(licenseInfo) {
  if (!licenseInfo?.image) return null;
  return new URL(`../../../assets/${licenseInfo.image}`, import.meta.url).href;
}
