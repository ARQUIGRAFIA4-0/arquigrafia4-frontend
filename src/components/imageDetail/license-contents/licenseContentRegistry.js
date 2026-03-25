import LicenseContentBy from "./LicenseContentBy.vue";
import LicenseContentBySa from "./LicenseContentBySa.vue";
import LicenseContentByNc from "./LicenseContentByNc.vue";
import LicenseContentByNcSa from "./LicenseContentByNcSa.vue";
import LicenseContentByNd from "./LicenseContentByNd.vue";
import LicenseContentByNcNd from "./LicenseContentByNcNd.vue";
import LicenseContentCc0 from "./LicenseContentCc0.vue";
import LicenseContentUnknown from "./LicenseContentUnknown.vue";

/** Mapeia `licenseInfo.label` (retorno de `findLicenseByUrl`) → componente de conteúdo */
export const LICENSE_CONTENT_BY_LABEL = {
  "BY": LicenseContentBy,
  "BY-SA": LicenseContentBySa,
  "BY-NC": LicenseContentByNc,
  "BY-NC-SA": LicenseContentByNcSa,
  "BY-ND": LicenseContentByNd,
  "BY-NC-ND": LicenseContentByNcNd,
  "CC0": LicenseContentCc0,
};

/**
 * @param {{ label: string } | null | undefined} licenseInfo
 * @returns {import("vue").Component}
 */
export function getLicenseContentComponent(licenseInfo) {
  if (!licenseInfo?.label) {
    return LicenseContentUnknown;
  }

  return LICENSE_CONTENT_BY_LABEL[licenseInfo.label] ?? LicenseContentUnknown;
}
