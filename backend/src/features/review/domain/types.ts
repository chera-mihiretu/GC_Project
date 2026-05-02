export interface Review {
  id: string;
  bookingId: string;
  coupleId: string;
  vendorId: string;
  vendorProfileId: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewDTO {
  bookingId: string;
  coupleId: string;
  vendorId: string;
  vendorProfileId: string;
  rating: number;
  comment?: string;
}

export interface ReviewListFilters {
  vendorProfileId?: string;
  coupleId?: string;
  isApproved?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
