import { API_BASE_URL } from '@/lib/config';
import { readErrorMessage } from '@/lib/api/http';
import type { GarmentSummary } from '@/lib/api/types';
import type { AppLocale } from '@/lib/i18n/types';

export async function fetchUserGarments(
  userId: string,
  lang: AppLocale = 'en',
): Promise<GarmentSummary[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/garments?lang=${lang}`,
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as GarmentSummary[];
}

export async function updateGarmentLabel(
  userId: string,
  garmentId: string,
  label: string,
  lang: AppLocale = 'en',
): Promise<GarmentSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/garments/${garmentId}?lang=${lang}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as GarmentSummary;
}

export async function deleteGarment(userId: string, garmentId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/garments/${garmentId}`,
    { method: 'DELETE' },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}
