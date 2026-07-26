import { API_BASE_URL } from '@/lib/config';
import { readErrorMessage } from '@/lib/api/http';
import type {
  CreateUploadBatchRequest,
  GarmentExtractionResponse,
  UploadBatchResponse,
  UploadBatchStatusResponse,
} from '@/lib/api/types';

export async function createUploadBatch(
  request: CreateUploadBatchRequest,
): Promise<UploadBatchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/uploads/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UploadBatchResponse;
}

export async function putPhotoToSignedUrl(
  uploadUrl: string,
  localUri: string,
  contentType: string,
): Promise<void> {
  const fileResponse = await fetch(localUri);
  if (!fileResponse.ok) {
    throw new Error('Failed to read selected photo');
  }

  const body = await fileResponse.blob();
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  });

  if (!response.ok) {
    throw new Error(`Photo upload failed (${response.status})`);
  }
}

export async function getUploadBatch(batchId: string): Promise<UploadBatchStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/uploads/batches/${batchId}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UploadBatchStatusResponse;
}

export async function getGarmentExtraction(itemId: string): Promise<GarmentExtractionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/uploads/items/${itemId}/extraction`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as GarmentExtractionResponse;
}
