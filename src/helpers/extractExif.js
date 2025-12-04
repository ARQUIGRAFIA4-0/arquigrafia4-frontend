import exifr from "exifr";

/**
 * Extrai dados EXIF de um arquivo de imagem
 * @param {File} file - Arquivo de imagem
 * @returns {Promise<{coordinates: {lat: number, lng: number}|null, date: string|null}>}
 */
export async function extractExif(file) {
  const result = {
    coordinates: null,
    date: null,
  };

  try {
    const allExif = await exifr.parse(file);

    const gps = await exifr.gps(file);

    if (gps && gps.latitude !== undefined && gps.longitude !== undefined) {
      result.coordinates = {
        lat: gps.latitude,
        lng: gps.longitude,
      };
    }

    // Extrai data da imagem do parse completo
    if (allExif) {
      result.date =
        allExif.DateTimeOriginal ||
        allExif.DateTimeDigitized ||
        allExif.CreateDate ||
        allExif.DateTime ||
        null;
    }

    console.log("result:", result);
    return result;
  } catch (error) {
    console.warn("Erro ao extrair EXIF:", error);
    return result;
  }
}

/**
 * Extrai dados EXIF de múltiplos arquivos
 * @param {File[]} files
 * @returns {Promise<Map<File, {coordinates: {lat: number, lng: number}|null, date: string|null}>>}
 */
export async function extractExifFromFiles(files) {
  const results = new Map();

  await Promise.all(
    files.map(async (file) => {
      const exifData = await extractExif(file);
      results.set(file, exifData);
    })
  );

  return results;
}
