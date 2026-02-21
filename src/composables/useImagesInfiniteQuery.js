import { computed, unref } from "vue";
import { useInfiniteQuery } from "@tanstack/vue-query";
import { api } from "@/services/api";

export const useImagesInfiniteQuery = (options = {}) => {
  const { limit, initialLimit, filters, queryKey, ...queryOptions } = options;

  // Contrói a chave de consulta dinâmica que inclui filtros para a invalidação adequada do cache
  const baseKey = queryKey || ["images"];
  const normalizedBaseKey = Array.isArray(baseKey) ? baseKey : [baseKey];
  
  // Torna a chave de consulta reativa usando um computed que desembrulha os filtros se for um ref
  const dynamicQueryKey = computed(() => {
    const filtersValue = unref(filters);
    const hasFilters = filtersValue && (
      (filtersValue.subjects && filtersValue.subjects.length > 0) ||
      filtersValue.subjectTerm ||
      filtersValue.userId
    );
    
    if (hasFilters) {
      const filterKey = {};
      if (filtersValue.subjects && filtersValue.subjects.length > 0) {
        filterKey.subjects = filtersValue.subjects;
      }
      if (filtersValue.subjectTerm) {
        filterKey.subjectTerm = filtersValue.subjectTerm;
      }
      if (filtersValue.userId) {
        filterKey.userId = filtersValue.userId;
      }
      return [...normalizedBaseKey, filterKey];
    }
    return normalizedBaseKey;
  });

  const query = useInfiniteQuery({
    queryKey: dynamicQueryKey,
    queryFn: ({ pageParam = 1 }) => {
      const filtersValue = unref(filters);
      return api.getImages(pageParam, {
        limit,
        initialLimit,
      }, filtersValue);
    },
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
