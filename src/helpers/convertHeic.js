import heic2any from "heic2any";

/**
 * Detects if a file is a HEIC/HEIF image by MIME type or file extension.
 * Non-Safari browsers often report HEIC files with an empty MIME type,
 * so we also check the file name.
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
 * Converts a HEIC/HEIF file to a JPEG File object.
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
 * Converts any HEIC/HEIF files in the array to JPEG, leaving other files unchanged.
 * @param {File[]} files
 * @returns {Promise<File[]>}
 */
export async function convertFilesIfHeic(files) {
  return Promise.all(
    files.map((file) => (isHeicFile(file) ? convertHeicToJpg(file) : file))
  );
}
