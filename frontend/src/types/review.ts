export interface Review {
  id: string;
  bookingId: string;
  coupleId: string;
  vendorId: string;
  vendorProfileId: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithAuthor extends Review {
  authorName: string;
  vendorName?: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}
