const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

/**
 * URL do avatar de um usuário ou coletivo, ou `null` quando não há foto (o
 * chamador decide o placeholder).
 *
 * A API expõe o avatar de duas formas, e a ordem importa:
 * - `avatar_url` tem prioridade e pode vir absoluta (http) ou relativa à API;
 * - `avatar_path` é só o caminho no storage, e precisa do prefixo `/storage/`.
 *
 * Essa lógica estava repetida em ProfileCard, AppHeader, EditProfileForm,
 * CollectiveCard, CollectiveEditForm, CollectiveMembers e ImageDisplay — os
 * comentários naqueles arquivos já sinalizavam a duplicação.
 */
export const resolveAvatarUrl = (entity) => {
  if (!entity) return null;

  if (entity.avatar_url) {
    return entity.avatar_url.startsWith("http")
      ? entity.avatar_url
      : `${API_BASE_URL}${entity.avatar_url}`;
  }

  if (entity.avatar_path) {
    return `${API_BASE_URL}/storage/${entity.avatar_path}`;
  }

  return null;
};
