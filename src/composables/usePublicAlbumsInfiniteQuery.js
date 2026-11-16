import { computed, toValue } from "vue";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/vue-query";
import { api } from "@/services/api";

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

  const items = computed(() => {
    const pages = query.data?.value?.pages ?? [];
    return pages.flatMap((page) => page?.items ?? []);
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
