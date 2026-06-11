import { useInfiniteQuery } from '@tanstack/react-query';
import type { Artist, GetArtistsParams } from '@piums/sdk';

export interface ArtistsFilters {
  q?: string;
  category?: string;
  cityId?: string;
  guests?: number;
}

interface ArtistsPageResponse {
  artists: Artist[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

const ITEMS_PER_PAGE = 12;

// ─── Accent normalization + category alias resolution ─────────────────────────

/** Strip diacritics so "música" → "musica", "Ángel" → "Angel" */
function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizes the free-text query (strip accents, lowercase).
 * Free-text always goes through smartSearch — no category alias conversion.
 * The category dropdown still works as an explicit filter.
 */
function resolveFilters(filters: ArtistsFilters): ArtistsFilters {
  if (!filters.q) return filters;
  const norm = stripAccents(filters.q).toLowerCase().trim();
  return { ...filters, q: norm };
}

// ─── Real API path ────────────────────────────────────────────────────────────

type ArtistsQueryParams = GetArtistsParams;

const fetchArtistsPage = async (
  page: number,
  filters: ArtistsFilters
): Promise<ArtistsPageResponse> => {
  try {
    const resolved = resolveFilters(filters);

    // Build query params directly — SDK sends 'categoria'/'ciudad' but
    // artists-service expects 'category'/'city', so we call the endpoint manually.
    const params = new URLSearchParams();
    if (resolved.q)        params.append('q',        resolved.q);
    if (resolved.category) params.append('category', resolved.category);
    if (resolved.cityId)   params.append('city',     resolved.cityId);
    params.append('page',  String(page));
    params.append('limit', String(ITEMS_PER_PAGE));

    const response = await fetch(`/api/artists/search?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const artists = data.artists ?? [];
    const total   = data.pagination?.total ?? artists.length;
    const totalPages = data.pagination?.totalPages ?? Math.ceil(total / ITEMS_PER_PAGE);

    return {
      artists,
      total,
      page:        data.pagination?.page ?? page,
      totalPages,
      hasNextPage: page < totalPages,
    };
  } catch (err) {
    console.error('[useInfiniteArtists] API error:', err);
    throw err;
  }
};

export function useInfiniteArtists(filters: ArtistsFilters) {
  return useInfiniteQuery({
    queryKey: ['artists', filters],
    queryFn: ({ pageParam = 1 }) => fetchArtistsPage(pageParam, filters),
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30 * 1000, // 30 s — short enough to recover quickly from transient errors
  });
}

