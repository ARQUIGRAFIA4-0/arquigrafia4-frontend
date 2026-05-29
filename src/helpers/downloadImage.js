import { findLicenseByUrl } from "@/constants/creativeCommonsLicenses";

const IIIF_BASE = "https://api-dev.arquigrafia.org.br";

export function getImageDownloadUrl(image) {
  if (!image?.id) return null;
  return image.fullUrl || `${IIIF_BASE}/iiif/${image.id}/full/max/0/default.jpg`;
}

export function sanitizeDownloadFilename(name, fallback = "imagem") {
  return (
    String(name || fallback)
      .normalize("NFC")
      .replace(/[<>:"/\\|?*]/g, "_")
      .trim()
      .slice(0, 120) || fallback
  );
}

/** Código da licença CC (ex.: BY-NC-SA, CC0) a partir de image.rights */
export function getImageRightsCode(image) {
  const rightsUrl = image?.rights?.[0]?.href;
  const license = findLicenseByUrl(rightsUrl);
  if (license?.label) return license.label;

  const direct = image?.license;
  if (typeof direct === "string" && direct.trim()) {
    return direct.replace(/^CC\s+/i, "").trim() || direct.trim();
  }

  return null;
}

export function getImageDownloadFilename(image, nomesUsados) {
  const titlePart = sanitizeDownloadFilename(image?.title, image?.id || "imagem");
  const rightsCode = getImageRightsCode(image);
  const rightsPart = rightsCode
    ? sanitizeDownloadFilename(String(rightsCode).replace(/\s+/g, "-"))
    : "";
  const base = rightsPart ? `${titlePart}_${rightsPart}` : titlePart;
  let nome = `${base}.jpg`;

  if (nomesUsados) {
    let i = 1;
    while (nomesUsados.has(nome)) {
      nome = `${base}_${i++}.jpg`;
    }
    nomesUsados.add(nome);
  }

  return nome;
}

export async function downloadImageFile(image) {
  const url = getImageDownloadUrl(image);
  if (!url) throw new Error("URL de download indisponível");

  const filename = getImageDownloadFilename(image);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}
