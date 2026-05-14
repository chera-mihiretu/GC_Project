export interface ChecklistItem {
  id: string;
  userId: string;
  title: string;
  category: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  sortOrder: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChecklistDTO {
  userId: string;
  title: string;
  category?: string;
  dueDate?: string;
  sortOrder?: number;
  notes?: string;
}

export interface UpdateChecklistDTO {
  title?: string;
  category?: string | null;
  dueDate?: string | null;
  sortOrder?: number;
  notes?: string | null;
  isCompleted?: boolean;
}

export interface ChecklistProgress {
  total: number;
  completed: number;
}
