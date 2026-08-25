export const FAVORITES_COLLECTION_TITLE = "Favoritos";

export function normalizeAlbumTitle(title) {
  return String(title || "").trim().toLocaleLowerCase("pt-BR");
}

export function isFavoritesAlbumTitle(title) {
  return normalizeAlbumTitle(title) === normalizeAlbumTitle(FAVORITES_COLLECTION_TITLE);
}

export function isFavoritesAlbum(album) {
  if (!album) return false;
  if (album.is_default === true) return true;
  return isFavoritesAlbumTitle(album.title);
}

export function sortAlbumsWithFavoritesFirst(albums = []) {
  return [...albums].sort((a, b) => {
    const aIsFav = isFavoritesAlbum(a);
    const bIsFav = isFavoritesAlbum(b);
    if (aIsFav === bIsFav) return 0;
    return aIsFav ? -1 : 1;
  });
}

export function excludeFavoritesAlbums(albums = []) {
  return albums.filter((album) => !isFavoritesAlbum(album));
}

export function buildDefaultFavoritesAlbumPayload() {
  return {
    title: FAVORITES_COLLECTION_TITLE,
    description: "",
    is_private: false,
  };
}
