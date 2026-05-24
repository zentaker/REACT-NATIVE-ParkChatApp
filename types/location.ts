export type LocationPermissionStatus =
  | "unknown"
  | "granted"
  | "denied"
  | "unavailable";

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

export type PlaceWithDistance = {
  id: string;
  name: string;
  distanceMeters: number;
  isNearby: boolean;
  isInsideRadius: boolean;
  distanceLabel: string;
};
