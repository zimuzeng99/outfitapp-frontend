import { API_BASE_URL } from '@/lib/config';
import { readErrorMessage } from '@/lib/api/http';
import type {
  BuyAdviceResponse,
  CreateBuyAdviceRequest,
  CreateBuyAdviceResponse,
} from '@/lib/api/types';
import type { AppLocale } from '@/lib/i18n/types';

export async function createBuyAdvice(
  userId: string,
  request: CreateBuyAdviceRequest,
  lang: AppLocale = 'en',
): Promise<CreateBuyAdviceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/buy-advice?lang=${lang}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as CreateBuyAdviceResponse;
}

export async function getBuyAdvice(
  userId: string,
  adviceId: string,
  lang: AppLocale = 'en',
): Promise<BuyAdviceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/buy-advice/${adviceId}?lang=${lang}`,
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as BuyAdviceResponse;
}
