export type PlaceType =
  | "park"
  | "plaza"
  | "cafe"
  | "campus"
  | "coworking"
  | "neighborhood"
  | "beach"
  | "market"
  | "cultural_space"
  | "other";

export type PlaceVisibility = "public" | "moderated" | "restricted";

export type Place = {
  id: string;
  name: string;
  description: string | null;
  type: PlaceType;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  city: string | null;
  country: string | null;
  visibility: PlaceVisibility;
  createdAt: string;
  updatedAt: string;
  activeUsersCount?: number;
  activeConversationsCount?: number;
  groupsCount?: number;
  eventsCount?: number;
};
