export type ProbabilityMode = 'equal' | 'weighted';

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface DrawItem {
  id: string;
  drawId: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
  sortOrder: number;
}

export interface LuckyDraw {
  id: string;
  userId: string;
  name: string;
  drawButtonLabel: string;
  probabilityMode: ProbabilityMode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: DrawItem[];
}

export interface DrawItemFormInput {
  name: string;
  quantity: number;
  imageFile?: File | null;
  imageUrl?: string | null;
}

export interface LuckyDrawFormInput {
  name: string;
  drawButtonLabel: string;
  probabilityMode: ProbabilityMode;
  items: DrawItemFormInput[];
}

export interface DrawResult {
  item: DrawItem;
  isNew: boolean;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
