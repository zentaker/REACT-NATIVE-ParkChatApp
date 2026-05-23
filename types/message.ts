import type { Profile } from "./profile";

export type ModerationStatus = "visible" | "flagged" | "hidden";

export type TopicTag = {
  id: string;
  name: string;
  createdAt: string;
};

export type PlaceMessage = {
  id: string;
  placeId: string;
  userId: string | null;
  body: string;
  moderationStatus: ModerationStatus;
  createdAt: string;
  profile?: Profile | null;
  topicTags?: TopicTag[];
};
