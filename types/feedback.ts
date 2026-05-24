export type FeedbackCategory =
  | "bug"
  | "confusing"
  | "safety"
  | "location"
  | "chat"
  | "groups"
  | "events"
  | "other";

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Error o bug",
  confusing: "Algo confuso",
  safety: "Seguridad",
  location: "Ubicación",
  chat: "Chat",
  groups: "Grupos",
  events: "Eventos",
  other: "Otro"
};

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  "chat",
  "groups",
  "events",
  "location",
  "confusing",
  "safety",
  "bug",
  "other"
];

export type PilotFeedback = {
  id: string;
  userId: string | null;
  placeId: string | null;
  rating: number | null;
  category: FeedbackCategory | null;
  message: string | null;
  createdAt: string;
};

export type CreateFeedbackInput = {
  rating: number;
  category: FeedbackCategory;
  message?: string;
  placeId?: string;
};
