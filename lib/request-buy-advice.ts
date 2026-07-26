import { createBuyAdvice, getBuyAdvice } from '@/lib/api/buy-advice';
import type { BuyAdviceResponse, BuyAdviceStatus } from '@/lib/api/types';
import { putPhotoToSignedUrl } from '@/lib/api/uploads';
import type { AppLocale } from '@/lib/i18n/types';

const CONTENT_TYPE = 'image/jpeg';
const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 80;

export type BuyAdviceProgress = 'uploading' | 'analyzing';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTerminalStatus(status: BuyAdviceStatus): boolean {
  return status === 'COMPLETED' || status === 'FAILED';
}

async function waitForBuyAdvice(
  userId: string,
  adviceId: string,
  lang: AppLocale,
): Promise<BuyAdviceResponse> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const advice = await getBuyAdvice(userId, adviceId, lang);

    if (isTerminalStatus(advice.status)) {
      if (advice.status === 'FAILED') {
        throw new Error(advice.errorMessage?.trim() || 'Buy advice failed');
      }
      return advice;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Timed out waiting for buy advice');
}

export async function requestBuyAdvice(
  userId: string,
  localUri: string,
  options?: {
    lang?: AppLocale;
    onProgress?: (phase: BuyAdviceProgress) => void;
  },
): Promise<BuyAdviceResponse> {
  const lang = options?.lang ?? 'en';

  options?.onProgress?.('uploading');

  const created = await createBuyAdvice(
    userId,
    {
      contentType: CONTENT_TYPE,
    },
    lang,
  );

  await putPhotoToSignedUrl(created.uploadUrl, localUri, CONTENT_TYPE);

  options?.onProgress?.('analyzing');

  return waitForBuyAdvice(userId, created.adviceId, lang);
}
