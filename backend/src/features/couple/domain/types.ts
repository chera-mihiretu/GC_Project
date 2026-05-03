export interface CoupleProfile {
  id: string;
  userId: string;
  weddingDate: string | null;
  budgetCurrency: string;
  estimatedGuests: number | null;
  weddingTheme: string | null;
  weddingLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  partnerName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCoupleProfileDTO {
  userId: string;
  weddingDate?: string;
  budgetCurrency?: string;
  estimatedGuests?: number;
  weddingTheme?: string;
  weddingLocation?: string;
  latitude?: number;
  longitude?: number;
  partnerName?: string;
}

export interface UpdateCoupleProfileDTO {
  weddingDate?: string | null;
  budgetCurrency?: string;
  estimatedGuests?: number | null;
  weddingTheme?: string | null;
  weddingLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  partnerName?: string | null;
}
