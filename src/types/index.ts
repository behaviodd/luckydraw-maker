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
  remaining: number;
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
  ticketOptions: number[];
  createdAt: string;
  updatedAt: string;
  items?: DrawItem[];
}

export interface DrawItemFormInput {
  name: string;
  quantity: number;
  remaining?: number;
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

export interface AnnouncementWithReadStatus extends Announcement {
  isRead: boolean;
}

export type FeedbackCategory = 'bug' | 'feature' | 'general' | 'other';

export interface Feedback {
  id: string;
  userId: string | null;
  senderEmail: string;
  subject: string;
  message: string;
  category: FeedbackCategory;
  isRead: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  isAdmin: boolean;
  drawCount: number;
}

export interface AdminDraw {
  id: string;
  userId: string;
  name: string;
  drawButtonLabel: string;
  probabilityMode: ProbabilityMode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerDisplayName: string | null;
  ownerEmail: string;
  ownerAvatarUrl: string | null;
  itemCount: number;
  totalQuantity: number;
  totalRemaining: number;
}

export interface AdminDrawDetail {
  draw: LuckyDraw;
  items: DrawItem[];
  owner: { displayName: string | null; avatarUrl: string | null; email: string };
}
