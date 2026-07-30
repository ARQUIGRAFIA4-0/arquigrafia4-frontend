import { computed, toValue } from "vue";
import { useInfiniteQuery } from "@tanstack/vue-query";
import { api } from "@/services/api";

export const useImagesInfiniteQuery = (options = {}) => {
  const { search, filters, queryKey = ["images"], ...queryOptions } = options;

  const normalizedBaseKey = Array.isArray(queryKey)
    ? queryKey
    : [queryKey];

  const resolvedQueryKey = computed(() => {
    const searchVal = toValue(search);
    const filtersVal = toValue(filters);
    if (searchVal) {
      return [...normalizedBaseKey, "search", searchVal];
    }
    if (filtersVal) {
      // Cria uma chave dinâmica baseada nos filtros presentes
      const filterKey = {};
      if (filtersVal.q) filterKey.q = filtersVal.q;
      if (filtersVal.date_from) filterKey.date_from = filtersVal.date_from;
      if (filtersVal.date_to) filterKey.date_to = filtersVal.date_to;
      if (filtersVal.userId) filterKey.userId = filtersVal.userId;
      if (filtersVal.collectiveId) filterKey.collectiveId = filtersVal.collectiveId;
      if (filtersVal.subjects?.length) filterKey.subjects = [...filtersVal.subjects].sort().join(',');
      if (filtersVal.subjectTerms?.length) filterKey.subjectTerms = [...filtersVal.subjectTerms].sort().join(',');
      if (filtersVal.title) filterKey.title = filtersVal.title;
      if (filtersVal.contributor) filterKey.contributor = filtersVal.contributor;
      if (filtersVal.sortBy) filterKey.sortBy = filtersVal.sortBy;
      if (filtersVal.sortOrder) filterKey.sortOrder = filtersVal.sortOrder;
      if (filtersVal.excludeCollectives) filterKey.excludeCollectives = true;
      if (filtersVal.licenses?.length) filterKey.licenses = [...filtersVal.licenses].sort().join(',');
      
      if (Object.keys(filterKey).length > 0) {
        return [...normalizedBaseKey, "filters", filterKey];
      }
    }
    return normalizedBaseKey;
  });

  const query = useInfiniteQuery({
    queryKey: resolvedQueryKey,
    queryFn: ({ pageParam = 1 }) => {
      const searchVal = toValue(search);
      const filtersVal = toValue(filters);
      if (searchVal) {
        return api.searchImages({ ...searchVal, page: pageParam });
      }
      return api.getImages(pageParam, filtersVal);
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
