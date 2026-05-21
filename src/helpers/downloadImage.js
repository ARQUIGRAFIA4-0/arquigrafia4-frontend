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

export function getImageDownloadFilename(image, nomesUsados) {
  const base = sanitizeDownloadFilename(image?.title, image?.id || "imagem");
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
