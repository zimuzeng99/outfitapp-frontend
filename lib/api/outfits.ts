import { API_BASE_URL } from '@/lib/config';
import { readErrorMessage } from '@/lib/api/http';
import type {
  OutfitRecommendationRequest,
  OutfitRecommendationResponse,
} from '@/lib/api/types';
import type { AppLocale } from '@/lib/i18n/types';

export async function recommendOutfits(
  userId: string,
  context: string,
  lang: AppLocale = 'en',
  excludeOutfits?: string[][],
): Promise<OutfitRecommendationResponse> {
  const body: OutfitRecommendationRequest = { context };
  if (excludeOutfits && excludeOutfits.length > 0) {
    body.excludeOutfits = excludeOutfits;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/outfit-recommendations?lang=${lang}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as OutfitRecommendationResponse;
}
