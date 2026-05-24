import { mockPlaces } from "../data/mockPlaces";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { Place, PlaceType, PlaceVisibility } from "../types";
import type { UserLocation } from "../types/location";
import { calculateDistanceMeters, formatDistanceLabel } from "./location";

type PlaceRow = {
  id: string;
  name: string;
  description: string | null;
  type?: string | null;
  category?: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  radius_meters?: number | null;
  city: string | null;
  district?: string | null;
  country?: string | null;
  visibility: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type PlaceWithDistance = Place & {
  distanceMeters: number | null;
  distanceLabel: string | null;
  isNearby: boolean;
  isInsideRadius: boolean;
};

function mapCoordinate(value: number | string | null) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function mapPlaceRow(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: (row.type ?? row.category ?? "other") as PlaceType,
    latitude: mapCoordinate(row.latitude),
    longitude: mapCoordinate(row.longitude),
    radiusMeters: row.radius_meters ?? 150,
    city: row.district ? `${row.district}, ${row.city ?? ""}`.trim() : row.city,
    country: row.country ?? null,
    visibility: (row.visibility ?? "public") as PlaceVisibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    activeUsersCount: 0,
    activeConversationsCount: 0,
    groupsCount: 0,
    eventsCount: 0
  };
}

export async function getNearbyPlaces(): Promise<Place[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockPlaces;
  }

  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Falling back to mock places:", error?.message);
    return mockPlaces;
  }

  return (data as PlaceRow[]).map(mapPlaceRow);
}

export async function getPlaceById(id: string): Promise<Place | null> {
  if (!isSupabaseConfigured || !supabase) {
    return mockPlaces.find((place) => place.id === id) ?? null;
  }

  const { data, error } = await supabase.from("places").select("*").eq("id", id).single();

  if (error || !data) {
    console.warn("Falling back to mock place:", error?.message);
    return mockPlaces.find((place) => place.id === id) ?? null;
  }

  return mapPlaceRow(data as PlaceRow);
}

export function annotatePlacesWithDistance(
  places: Place[],
  userLocation: UserLocation | null
): PlaceWithDistance[] {
  return places.map((place) => {
    if (!userLocation || !place.latitude || !place.longitude) {
      return {
        ...place,
        distanceMeters: null,
        distanceLabel: null,
        isNearby: false,
        isInsideRadius: false
      };
    }

    const dist = calculateDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      place.latitude,
      place.longitude
    );

    return {
      ...place,
      distanceMeters: dist,
      distanceLabel: formatDistanceLabel(dist),
      isNearby: dist <= 2000,
      isInsideRadius: dist <= (place.radiusMeters ?? 150)
    };
  });
}

export function sortPlacesByDistance(
  places: PlaceWithDistance[]
): PlaceWithDistance[] {
  return [...places].sort((a, b) => {
    if (a.distanceMeters === null && b.distanceMeters === null) return 0;
    if (a.distanceMeters === null) return 1;
    if (b.distanceMeters === null) return -1;
    return a.distanceMeters - b.distanceMeters;
  });
}

export async function getNearbyPlacesWithDistance(
  userLocation: UserLocation | null
): Promise<PlaceWithDistance[]> {
  const places = await getNearbyPlaces();
  const annotated = annotatePlacesWithDistance(places, userLocation);
  return sortPlacesByDistance(annotated);
}
