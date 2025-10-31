import { computed } from "vue";
import { useInfiniteQuery } from "@tanstack/vue-query";
import { api } from "@/services/api";

export const useImagesInfiniteQuery = (options = {}) => {
  const { limit, initialLimit, queryKey = ["images"], ...queryOptions } =
    options;

  const normalizedQueryKey = Array.isArray(queryKey)
    ? queryKey
    : [queryKey];

  const query = useInfiniteQuery({
    queryKey: normalizedQueryKey,
    queryFn: ({ pageParam = 1 }) =>
      api.getImages(pageParam, {
        limit,
        initialLimit,
      }),
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
