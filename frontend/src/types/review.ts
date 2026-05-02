export interface Review {
  id: string;
  bookingId: string;
  coupleId: string;
  vendorId: string;
  vendorProfileId: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}
