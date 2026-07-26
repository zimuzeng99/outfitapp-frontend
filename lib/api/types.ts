/** Matches OpenAPI `CreateUserRequest`. */
export type CreateUserRequest = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

/** Matches OpenAPI `UserResponse`. */
export type UserResponse = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Matches OpenAPI `GarmentSummaryResponse`. */
export type GarmentSummary = {
  garmentId: string;
  label: string;
  imageUrl: string;
  imageUrlExpiresAt: string;
};

/** Matches OpenAPI `UpdateGarmentLabelRequest`. */
export type UpdateGarmentLabelRequest = {
  label: string;
};

export type ErrorResponse = {
  code: string;
  message: string;
};

export type UploadStatus = 'PENDING' | 'UPLOADED' | 'COMPLETED' | 'EXPIRED';

export type GarmentExtractionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type CreateUploadBatchRequest = {
  userId: string;
  photoCount: number;
  contentType: string;
};

export type UploadUrlResponse = {
  itemId: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
};

export type UploadBatchResponse = {
  batchId: string;
  status: UploadStatus;
  uploads: UploadUrlResponse[];
};

export type UploadItemStatusResponse = {
  itemId: string;
  objectKey: string;
  status: UploadStatus;
};

export type UploadBatchStatusResponse = {
  batchId: string;
  status: UploadStatus;
  items: UploadItemStatusResponse[];
};

export type GarmentExtractionResponse = {
  itemId: string;
  status: GarmentExtractionStatus;
  lastAttemptedAt?: string | null;
  completedAt?: string | null;
  lastErrorMessage?: string | null;
  aiModel?: string | null;
};

/** Matches OpenAPI `OutfitRecommendationRequest`. */
export type OutfitRecommendationRequest = {
  context: string;
  excludeOutfits?: string[][];
};

/** Matches OpenAPI `RecommendedOutfitResponse`. */
export type RecommendedOutfit = {
  title?: string;
  rationale?: string;
  garments?: GarmentSummary[];
};

/** Matches OpenAPI `OutfitRecommendationResponse`. */
export type OutfitRecommendationResponse = {
  context: string;
  outfits: RecommendedOutfit[];
  hasMore: boolean;
};

export type BuyAdviceStatus = 'PENDING' | 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type WardrobeValue = 'HIGH' | 'MEDIUM' | 'LOW';

/** Matches OpenAPI `CreateBuyAdviceRequest`. */
export type CreateBuyAdviceRequest = {
  contentType: string;
  context?: string;
};

/** Matches OpenAPI `CreateBuyAdviceResponse`. */
export type CreateBuyAdviceResponse = {
  adviceId: string;
  status: BuyAdviceStatus;
  objectKey: string;
  uploadUrl: string;
  uploadUrlExpiresAt: string;
};

/** Matches OpenAPI `GarmentMetadataResponse` (loose client shape). */
export type GarmentMetadata = {
  garmentGroup?: string;
  category?: string;
  primaryColour?: string;
  secondaryColours?: string[];
  pattern?: string;
  seasons?: string[];
  occasions?: string[];
  fit?: string;
  silhouette?: string;
  material?: string;
  sleeveLength?: string;
  neckline?: string;
  length?: string;
  layerRole?: string;
  warmth?: string;
  formality?: number;
  styleTags?: string[];
  description?: string | null;
};

/** Matches OpenAPI `BuyAdviceCandidateResponse`. */
export type BuyAdviceCandidate = {
  label?: string;
  imageUrl?: string;
  imageUrlExpiresAt?: string;
  metadata?: GarmentMetadata | null;
};

/** Matches OpenAPI `BuyAdviceOverlapResponse`. */
export type BuyAdviceOverlap = {
  nearDuplicates?: GarmentSummary[];
};

/** Matches OpenAPI `BuyAdviceOutfitGarmentResponse`. */
export type BuyAdviceOutfitGarment = {
  garmentId?: string | null;
  label: string;
  imageUrl: string;
  imageUrlExpiresAt: string;
};

/** Matches OpenAPI `BuyAdviceOutfitResponse`. */
export type BuyAdviceOutfit = {
  title?: string;
  rationale?: string;
  garments?: BuyAdviceOutfitGarment[];
};

/** Matches OpenAPI `BuyAdviceResponse`. */
export type BuyAdviceResponse = {
  adviceId: string;
  status: BuyAdviceStatus;
  context?: string | null;
  wardrobeValue?: WardrobeValue | null;
  rationale?: string | null;
  candidate?: BuyAdviceCandidate | null;
  overlap?: BuyAdviceOverlap | null;
  compatibleOutfitCountMin?: number | null;
  compatibleOutfitCountMax?: number | null;
  potentialOutfits?: BuyAdviceOutfit[];
  errorMessage?: string | null;
};
