import heic2any from "heic2any";

/**
 * Identifica se um arquivo é uma imagem HEIC/HEIF pelo MIME type ou pela
 * extensão. Fora do Safari, o browser costuma entregar HEIC com o MIME vazio,
 * por isso também checamos o nome do arquivo.
 * @param {File} file
 * @returns {boolean}
 */
export function isHeicFile(file) {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

/**
 * Converte um arquivo HEIC/HEIF num objeto File JPEG.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function convertHeicToJpg(file) {
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
  const jpgName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([convertedBlob], jpgName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

/**
 * Aviso exibido quando um HEIC não pôde ser convertido no browser. O arquivo
 * segue no envio: só a pré-visualização é que não aparece.
 * @param {string[]} failed Nomes dos arquivos não convertidos
 * @returns {string}
 */
export function buildHeicFallbackMessage(failed) {
  const names = failed.join(", ");
  return failed.length === 1
    ? `Não foi possível pré-visualizar ${names}. Ele será enviado no formato original.`
    : `Não foi possível pré-visualizar ${failed.length} arquivos (${names}). Eles serão enviados no formato original.`;
}

// Converte um arquivo, sem nunca rejeitar: a libheif embutida na heic2any é
// antiga e desiste de variantes legítimas de HEIC (`ERR_LIBHEIF format not
// supported`). Nesse caso mantemos o arquivo original — o back-end recebe o
// HEIC e decide o que fazer com ele — em vez de descartar o envio.
async function convertOne(file) {
  if (!isHeicFile(file)) return { file, failed: false };

  try {
    return { file: await convertHeicToJpg(file), failed: false };
  } catch (error) {
    console.warn(`Não foi possível converter ${file.name} para JPEG:`, error);
    return { file, failed: true };
  }
}

/**
 * Converte para JPEG os arquivos HEIC/HEIF do array, deixando os demais
 * intactos. O arquivo cuja conversão falha é mantido como está e reportado em
 * `failed`, para que um HEIC problemático nunca derrube o lote inteiro.
 * @param {File[]} files
 * @returns {Promise<{ files: File[], failed: string[] }>} arquivos e os nomes
 *   dos que não puderam ser convertidos
 */
export async function convertFilesIfHeic(files) {
  const results = await Promise.all(files.map(convertOne));
  return {
    files: results.map((result) => result.file),
    failed: results.filter((result) => result.failed).map((r) => r.file.name),
  };
}
