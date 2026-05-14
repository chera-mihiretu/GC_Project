export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface VendorCard {
  id: string;
  businessName: string;
  category: string[];
  rating: number;
  reviewCount: number;
  thumbnail: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  location: string | null;
}

export interface BookingCard {
  bookingId: string;
  vendorBusinessName: string;
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  status: string;
  createdAt: string;
}

export interface PendingAction {
  type: "send_message" | "book_vendor" | "cancel_booking" | "reschedule_booking" | "confirm_action";
  description: string;
  params: Record<string, unknown>;
}

export interface AIResponse {
  reply: string;
  vendorCards: VendorCard[];
  bookingCards?: BookingCard[];
  pendingAction?: PendingAction;
}
