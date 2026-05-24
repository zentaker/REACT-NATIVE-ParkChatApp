import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationPermissionCard } from "../../components/LocationPermissionCard";
import { LoadingState } from "../../components/LoadingState";
import { NearbyPlaceBadge } from "../../components/NearbyPlaceBadge";
import { PlaceCard } from "../../components/PlaceCard";
import { PlacesMapView } from "../../components/PlacesMapView";
import { SafetyNotice } from "../../components/SafetyNotice";
import { EmptyState } from "../../components/EmptyState";
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
  const nearbyPlaces = hasLocation ? places.filter((p) => p.isNearby) : [];
  const otherPlaces = hasLocation ? places.filter((p) => !p.isNearby) : places;

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Tu barrio, en vivo</Text>
          <Text style={styles.title}>Mapa social</Text>
          <Text style={styles.subtitle}>
            {hasLocation
              ? "Lugares ordenados por cercanía a tu posición"
              : "Descubre comunidades alrededor de lugares reales"}
          </Text>
        </View>

        <SafetyNotice message="Tu ubicación se usa solo para ordenar lugares cercanos. No se comparte ni se guarda." />

        <LocationPermissionCard
          status={permissionStatus}
          onRequest={handleRequestPermission}
        />

        {isLoading ? <LoadingState label="Buscando lugares cercanos..." /> : null}

        {!isLoading && places.length > 0 ? (
          <PlacesMapView places={places} userLocation={userLocation} />
        ) : null}

        {!isLoading && places.length === 0 ? (
          <EmptyState
            icon="🗺️"
            title="No hay lugares disponibles"
            description="Aún no hay espacios registrados en tu zona. Desliza hacia abajo para actualizar."
          />
        ) : null}

        {!isLoading && nearbyPlaces.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📍 Cerca de ti</Text>
            <View style={styles.list}>
              {nearbyPlaces.map((place) => (
                <View key={place.id}>
                  <PlaceCard
                    onPress={() =>
                      router.push({ pathname: "/place/[id]", params: { id: place.id } })
                    }
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
          </View>
        ) : null}

        {!isLoading && otherPlaces.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {hasLocation && nearbyPlaces.length > 0 ? "🌆 Más lugares" : "🏘️ Lugares activos"}
            </Text>
            <View style={styles.list}>
              {otherPlaces.map((place) => (
                <View key={place.id}>
                  <PlaceCard
                    onPress={() =>
                      router.push({ pathname: "/place/[id]", params: { id: place.id } })
                    }
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
          </View>
        ) : null}
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
    gap: 4
  },
  kicker: {
    color: UI_COLORS.teal,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  section: {
    gap: 10
  },
  sectionLabel: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  list: {
    gap: 12
  },
  badgeRow: {
    alignItems: "flex-start",
    marginTop: -4,
    paddingHorizontal: 4
  }
});
