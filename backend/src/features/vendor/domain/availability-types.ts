export interface AvailabilityRange {
  id: string;
  vendorProfileId: string;
  startDate: string;
  endDate: string;
  note: string | null;
  createdAt: Date;
}

export interface CreateAvailabilityDTO {
  vendorProfileId: string;
  startDate: string;
  endDate: string;
  note?: string;
}
