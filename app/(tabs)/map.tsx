import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationPermissionCard } from "../../components/LocationPermissionCard";
import { LoadingState } from "../../components/LoadingState";
import { NearbyPlaceBadge } from "../../components/NearbyPlaceBadge";
import { PlaceCard } from "../../components/PlaceCard";
import { SafetyNotice } from "../../components/SafetyNotice";
import { UI_COLORS } from "../../lib/constants";
import {
  getCurrentLocation,
  getLocationPermissionStatus,
  requestLocationPermission
} from "../../services/location";
import { getNearbyPlacesWithDistance } from "../../services/places";
import type { PlaceWithDistance } from "../../services/places";
import type { LocationPermissionStatus, UserLocation } from "../../types/location";

export default function MapScreen() {
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>("unknown");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const loadPlaces = useCallback(async (loc: UserLocation | null) => {
    const nextPlaces = await getNearbyPlacesWithDistance(loc);
    setPlaces(nextPlaces);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const status = await getLocationPermissionStatus();
      if (!isMounted) return;
      setPermissionStatus(status);

      let loc: UserLocation | null = null;
      if (status === "granted") {
        loc = await getCurrentLocation();
        if (isMounted) setUserLocation(loc);
      }

      await loadPlaces(loc);
      if (isMounted) setIsLoading(false);
    }

    init().catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [loadPlaces]);

  async function handleRequestPermission() {
    const status = await requestLocationPermission();
    setPermissionStatus(status);

    if (status === "granted") {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      setIsLoading(true);
      await loadPlaces(loc);
      setIsLoading(false);
    }
  }

  const hasLocation = userLocation !== null;

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Lugares</Text>
          <Text style={styles.subtitle}>
            {hasLocation
              ? "Ordenados por cercanía a tu ubicación"
              : "Espacios públicos de la comunidad"}
          </Text>
        </View>

        <SafetyNotice message="Mostramos actividad agregada por lugar, no la posición exacta de personas." />

        <LocationPermissionCard
          status={permissionStatus}
          onRequest={handleRequestPermission}
        />

        {isLoading ? <LoadingState /> : null}

        {!isLoading && places.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay lugares disponibles aún.</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {places.map((place) => (
            <View key={place.id}>
              <PlaceCard
                onPress={() => router.push({ pathname: "/place/[id]", params: { id: place.id } })}
                place={place}
              />
              {place.distanceLabel ? (
                <View style={styles.badgeRow}>
                  <NearbyPlaceBadge
                    distanceLabel={place.distanceLabel}
                    isInsideRadius={place.isInsideRadius}
                    isNearby={place.isNearby}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: UI_COLORS.background,
    flex: 1
  },
  content: {
    gap: 18,
    padding: 18,
    paddingBottom: 32
  },
  header: {
    gap: 6
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  list: {
    gap: 12
  },
  badgeRow: {
    alignItems: "flex-start",
    marginTop: -4,
    paddingHorizontal: 4
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32
  },
  emptyText: {
    color: UI_COLORS.textMuted,
    fontSize: 14
  }
});
