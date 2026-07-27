import {
  createUploadBatch,
  getGarmentExtraction,
  getUploadBatch,
  putPhotoToSignedUrl,
} from '@/lib/api/uploads';
import type { GarmentExtractionStatus, UploadStatus } from '@/lib/api/types';

const CONTENT_TYPE = 'image/jpeg';
const UPLOAD_CONCURRENCY = 3;
const POLL_INTERVAL_MS = 1500;
const MAX_BATCH_POLLS = 40;
const MAX_EXTRACTION_POLLS = 80;

export type UploadPhotosProgress = 'uploading' | 'processing';

export type UploadPhotosResult = {
  completed: number;
  failed: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker(),
  );
  await Promise.all(workers);
}

function isBatchItemReady(status: UploadStatus): boolean {
  return status === 'UPLOADED' || status === 'COMPLETED';
}

function isExtractionDone(status: GarmentExtractionStatus): boolean {
  return status === 'COMPLETED' || status === 'FAILED';
}

async function waitForBatchUploads(batchId: string): Promise<string[]> {
  for (let attempt = 0; attempt < MAX_BATCH_POLLS; attempt += 1) {
    const batch = await getUploadBatch(batchId);

    if (batch.status === 'EXPIRED') {
      throw new Error('Upload batch expired before photos finished uploading');
    }

    const pending = batch.items.filter((item) => item.status === 'PENDING');
    if (pending.length === 0 && batch.items.every((item) => isBatchItemReady(item.status))) {
      return batch.items.map((item) => item.itemId);
    }

    if (batch.items.some((item) => item.status === 'EXPIRED')) {
      throw new Error('One or more upload items expired');
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Timed out waiting for photo uploads to complete');
}

async function waitForExtractions(itemIds: string[]): Promise<UploadPhotosResult> {
  const remaining = new Set(itemIds);
  let completed = 0;
  let failed = 0;

  for (let attempt = 0; attempt < MAX_EXTRACTION_POLLS && remaining.size > 0; attempt += 1) {
    for (const itemId of [...remaining]) {
      const extraction = await getGarmentExtraction(itemId);
      if (!isExtractionDone(extraction.status)) {
        continue;
      }

      remaining.delete(itemId);
      if (extraction.status === 'COMPLETED') {
        completed += 1;
      } else {
        failed += 1;
      }
    }

    if (remaining.size > 0) {
      await sleep(POLL_INTERVAL_MS);
    }
  }

  if (remaining.size > 0) {
    failed += remaining.size;
  }

  return { completed, failed };
}

export async function uploadPhotos(
  userId: string,
  localUris: string[],
  onProgress?: (phase: UploadPhotosProgress) => void,
): Promise<UploadPhotosResult> {
  if (localUris.length === 0) {
    return { completed: 0, failed: 0 };
  }

  if (localUris.length > 30) {
    throw new Error('You can upload at most 30 photos at a time');
  }

  onProgress?.('uploading');

  const batch = await createUploadBatch({
    userId,
    photoCount: localUris.length,
    contentType: CONTENT_TYPE,
  });

  if (batch.uploads.length !== localUris.length) {
    throw new Error('Upload batch size did not match selected photos');
  }

  await mapWithConcurrency(localUris, UPLOAD_CONCURRENCY, async (localUri, index) => {
    const upload = batch.uploads[index];
    await putPhotoToSignedUrl(upload.uploadUrl, localUri, CONTENT_TYPE);
  });

  const itemIds = await waitForBatchUploads(batch.batchId);

  onProgress?.('processing');

  return waitForExtractions(itemIds);
}
