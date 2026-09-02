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
const resolveBaseUrl = (entity) => {
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

// O backend regrava o avatar no mesmo caminho, então a URL não muda entre um
// upload e outro: o browser reaproveita a imagem em cache e a foto nova só
// aparece depois de um reload. O sufixo `?v=` muda a URL quando (e só quando) o
// avatar mudou, forçando uma requisição nova.
//
// O valor tem que vir dos dados, nunca de Date.now() na hora da renderização —
// senão cada re-render baixaria a imagem outra vez.
const versionOf = (entity) => {
  const stamp = entity.avatar_updated_at ?? entity.updated_at;
  if (!stamp) return null;

  const parsed = typeof stamp === "number" ? stamp : Date.parse(stamp);
  return Number.isFinite(parsed) ? parsed : null;
};

export const resolveAvatarUrl = (entity) => {
  if (!entity) return null;

  const base = resolveBaseUrl(entity);
  if (!base) return null;

  const version = versionOf(entity);
  if (!version) return base;

  return `${base}${base.includes("?") ? "&" : "?"}v=${version}`;
};
