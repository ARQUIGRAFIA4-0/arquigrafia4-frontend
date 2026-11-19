import { computed, toValue } from "vue";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/vue-query";
import { api } from "@/services/api";
import { excludeFavoritesAlbums } from "@/constants/favoritesCollection";

export const usePublicAlbumsInfiniteQuery = (options = {}) => {
  const { title, hasPercursos, perPage = 24, ...queryOptions } = options;

  const queryKey = computed(() => [
    "public-albums",
    {
      title: toValue(title)?.trim() || "",
      hasPercursos: toValue(hasPercursos) ?? null,
    },
  ]);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      api.getPublicAlbums({
        page: pageParam,
        perPage,
        title: toValue(title),
        hasPercursos: toValue(hasPercursos),
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    ...queryOptions,
  });

  // A coleção "Favoritos" de cada usuário é pública, mas não faz parte da
  // exploração de coleções; usa a mesma regra de identificação do perfil.
  const items = computed(() => {
    const pages = query.data?.value?.pages ?? [];
    return excludeFavoritesAlbums(pages.flatMap((page) => page?.items ?? []));
  });

  const hasNextPage = computed(() => Boolean(query.hasNextPage?.value));
  const isFetchingNextPage = computed(() => Boolean(query.isFetchingNextPage?.value));

  return {
    ...query,
    items,
    hasNextPage,
    isFetchingNextPage,
  };
};
