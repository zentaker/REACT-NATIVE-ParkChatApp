export type UserPlaceRelationshipType = "visited" | "active" | "regular" | "organizer";

export type TopicTagSource = "manual" | "hashtag" | "derived";

export type UserConnectionSource = "place" | "group" | "event";

export type UserPlace = {
  id: string;
  userId: string;
  placeId: string;
  relationshipType: UserPlaceRelationshipType;
  lastSeenAt: string;
  visitCount: number;
  createdAt: string;
};

export type TopicTag = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type MessageTopicTag = {
  id: string;
  messageId: string;
  topicTagId: string;
  createdAt: string;
};

export type PlaceTopic = {
  id: string;
  placeId: string;
  topicTagId: string;
  weight: number;
  lastActivityAt: string;
  createdAt: string;
  topicTag?: TopicTag;
};

export type UserTopicInterest = {
  id: string;
  userId: string;
  topicTagId: string;
  source: TopicTagSource;
  weight: number;
  createdAt: string;
  topicTag?: TopicTag;
};

export type UserConnection = {
  id: string;
  userA: string;
  userB: string;
  source: UserConnectionSource;
  placeId: string | null;
  eventId: string | null;
  groupId: string | null;
  weight: number;
  createdAt: string;
};
