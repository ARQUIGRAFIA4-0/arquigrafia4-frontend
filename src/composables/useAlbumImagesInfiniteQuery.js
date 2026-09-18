import { computed, toValue } from "vue";
import { useInfiniteQuery } from "@tanstack/vue-query";
import { api } from "@/services/api";

export const useAlbumImagesInfiniteQuery = (options = {}) => {
  const { albumId, queryKey = ["album-images"], ...queryOptions } = options;

  const normalizedBaseKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  const resolvedQueryKey = computed(() => [
    ...normalizedBaseKey,
    toValue(albumId) || "none",
  ]);

  const query = useInfiniteQuery({
    queryKey: resolvedQueryKey,
    queryFn: ({ pageParam = 1 }) =>
      api.getAlbumImages(toValue(albumId), pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.hasMore) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...queryOptions,
  });

  const items = computed(() => {
    const pages = query.data?.value?.pages ?? [];
    return pages.flatMap((page) => page?.items ?? []);
  });

  const hasNextPage = computed(() => Boolean(query.hasNextPage?.value));
  const isFetchingNextPage = computed(() =>
    Boolean(query.isFetchingNextPage?.value)
  );

  return {
    ...query,
    items,
    hasNextPage,
    isFetchingNextPage,
  };
};
