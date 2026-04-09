export const VendorStatus = {
  REGISTERED: "registered",
  PENDING_VERIFICATION: "pending_verification",
  VERIFIED: "verified",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
  DEACTIVATED: "deactivated",
} as const;

export type VendorStatus = (typeof VendorStatus)[keyof typeof VendorStatus];

export const DocumentType = {
  BUSINESS_LICENSE: "business_license",
  NATIONAL_ID: "national_id",
  OTHER: "other",
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string | null;
  category: string | null;
  description: string | null;
  phoneNumber: string | null;
  location: string | null;
  status: VendorStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorDocument {
  id: string;
  vendorProfileId: string;
  documentType: DocumentType;
  fileUrl: string;
  uploadedAt: Date;
}

export interface CreateVendorProfileDTO {
  userId: string;
  businessName?: string;
  category?: string;
  description?: string;
  phoneNumber?: string;
  location?: string;
}

export interface UpdateVendorProfileDTO {
  businessName?: string;
  category?: string;
  description?: string;
  phoneNumber?: string;
  location?: string;
}

export interface VendorListFilters {
  status?: VendorStatus;
  category?: string;
  location?: string;
  search?: string;
  sortBy?: "businessName" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
