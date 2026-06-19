import COLLECTION_COVER_IMAGES from "virtual:collection-covers";
import albumDefaultImage from "@/assets/album-default.png";

function hashString(value) {
  const text = String(value ?? "");
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);

}

export function getRandomCollectionCover(seed = null) {
  if (!COLLECTION_COVER_IMAGES.length) {
    return albumDefaultImage;
  }

  const index = seed ? hashString(seed) % COLLECTION_COVER_IMAGES.length : Math.floor(Math.random() * COLLECTION_COVER_IMAGES.length);
  return COLLECTION_COVER_IMAGES[index];
}

export function resolveAlbumCover(album) {
  const coverFromApi =
    album?.cover_url || album?.cover || album?.thumbnail || null;

  if (coverFromApi) {
    return coverFromApi;
  }

  return getRandomCollectionCover(album?.id);

}