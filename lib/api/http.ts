import type { ErrorResponse } from '@/lib/api/types';

export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponse;
    if (body?.message) {
      return body.message;
    }
  } catch {
    // ignore non-JSON error bodies
  }
  return `Request failed (${response.status})`;
}
