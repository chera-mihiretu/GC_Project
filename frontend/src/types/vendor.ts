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
  createdAt: string;
  updatedAt: string;
  documents?: VendorDocument[];
}

export interface VendorDocument {
  id: string;
  vendorProfileId: string;
  documentType: DocumentType;
  fileUrl: string;
  uploadedAt: string;
}

export const VENDOR_CATEGORIES = [
  "catering",
  "photography",
  "videography",
  "venue",
  "decoration",
  "music",
  "dj",
  "florist",
  "cake",
  "makeup",
  "hair",
  "transportation",
  "invitation",
  "jewelry",
  "attire",
  "other",
] as const;
