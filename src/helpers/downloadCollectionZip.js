import JSZip from "jszip";
import {
  getImageDownloadUrl,
  getImageDownloadFilename,
} from "@/helpers/downloadImage";

function baixarBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadCollectionAsZip(images, zipFilename = "coleção.zip") {
  if (!images?.length) {
    throw new Error("Esta coleção não possui imagens para download.");
  }

  const zip = new JSZip();
  const nomesUsados = new Set();

  for (const image of images) {
    const url = getImageDownloadUrl(image);
    if (!url) continue;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      zip.file(getImageDownloadFilename(image, nomesUsados), blob);
    } catch {
      // ignora imagem que falhou
    }
  }

  if (!Object.keys(zip.files).length) {
    throw new Error("Não foi possível baixar as imagens.");
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  baixarBlob(zipBlob, zipFilename);
}
