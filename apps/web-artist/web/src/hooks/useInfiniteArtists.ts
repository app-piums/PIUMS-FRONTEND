import { useInfiniteQuery } from '@tanstack/react-query';
import { sdk } from '@piums/sdk';
import type { Artist } from '@piums/sdk';

export interface ArtistsFilters {
  q?: string;
  category?: string;
  cityId?: string;
}

interface ArtistsPageResponse {
  artists: Artist[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

interface ArtistQueryParams {
  page: number;
  limit: number;
  category?: string;
  cityId?: string;
  q?: string;
}

const ITEMS_PER_PAGE = 12;

const fetchArtistsPage = async (
  page: number,
  filters: ArtistsFilters
): Promise<ArtistsPageResponse> => {
  const params: ArtistQueryParams = {
    page,
    limit: ITEMS_PER_PAGE,
  };

  if (filters.category) params.category = filters.category;
  if (filters.cityId) params.cityId = filters.cityId;
  if (filters.q) params.q = filters.q;

  const result = await sdk.getArtists(params);

  return {
    artists: result.artists,
    total: result.total || result.artists.length,
    page: result.page || page,
    totalPages: result.totalPages,
    hasNextPage: page < result.totalPages,
  };
};

export function useInfiniteArtists(filters: ArtistsFilters) {
  return useInfiniteQuery({
    queryKey: ['artists', filters],
    queryFn: ({ pageParam = 1 }) => fetchArtistsPage(pageParam, filters),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}
