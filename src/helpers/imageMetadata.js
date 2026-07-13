// Regra dos metadados mínimos obrigatórios para uma imagem poder ser enviada.
// Fonte única da verdade: usada tanto para liberar o botão de envio quanto para
// sinalizar (✓) os thumbnails já preenchidos no painel de upload.
export function isMetadataValid(metadata = {}) {
  if (!metadata.title?.trim()) {
    return false;
  }

  if (metadata.isAuthor || metadata.isPublicDomain) {
    return true;
  }

  if (!metadata.hasAuthorization && !metadata.unknownAuthor) {
    return false;
  }

  if (
    metadata.hasAuthorization &&
    !metadata.unknownAuthor &&
    !metadata.authorName?.trim()
  ) {
    return false;
  }

  return true;
}
