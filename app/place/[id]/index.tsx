import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { LoadingState } from "../../../components/LoadingState";
import { NearbyPlaceBadge } from "../../../components/NearbyPlaceBadge";
import { PlaceHeader } from "../../../components/PlaceHeader";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import {
  getPlaceGraphInsights,
  upsertUserPlace,
  type PlaceGraphInsights
} from "../../../services/graph";
import { trackPlaceViewed } from "../../../services/analytics";
import {
  getCurrentLocation,
  getLocationPermissionStatus,
  isWithinPlaceRadius,
  formatDistanceLabel,
  calculateDistanceMeters
} from "../../../services/location";
import { getPlaceById } from "../../../services/places";
import type { UserLocation } from "../../../types/location";
import type { Place } from "../../../types";

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");
  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<PlaceGraphInsights | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    let isMounted = true;

    getPlaceById(placeId)
      .then((nextPlace) => {
        if (isMounted) setPlace(nextPlace);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    upsertUserPlace(placeId, "visited").catch(() => {});
    trackPlaceViewed(placeId);

    getPlaceGraphInsights(placeId)
      .then((data) => {
        if (isMounted) setInsights(data);
      })
      .catch(() => {});

    getLocationPermissionStatus()
      .then(async (status) => {
        if (status === "granted") {
          const loc = await getCurrentLocation();
          if (isMounted) setUserLocation(loc);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [placeId]);

  const distanceMeters =
    userLocation && place
      ? calculateDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          place.latitude,
          place.longitude
        )
      : null;

  const insideRadius =
    userLocation && place ? isWithinPlaceRadius(userLocation, place) : false;

  const distanceLabel = distanceMeters !== null ? formatDistanceLabel(distanceMeters) : null;

  const geoStatus = !userLocation
    ? "Ubicación no disponible"
    : insideRadius
    ? "Estás dentro del área del lugar"
    : distanceMeters !== null && distanceMeters <= 2000
    ? "Estás cerca"
    : "Estás fuera del área";

  const visitCount = insights?.myRelationship?.visitCount ?? null;
  const lastSeenAt = insights?.myRelationship?.lastSeenAt ?? null;

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <LoadingState label="Abriendo lugar" /> : null}

        {!isLoading && !place ? (
          <EmptyState title="Lugar no encontrado" description="Este espacio no existe en mocks ni en Supabase." />
        ) : null}

        {place ? (
          <>
            <PlaceHeader place={place} />
            <SafetyNotice />

            {/* Geospatial context */}
            <View style={styles.sectionCard}>
              <View style={styles.geoHeader}>
                <Text style={styles.sectionTitle}>Contexto geoespacial</Text>
                {distanceLabel ? (
                  <NearbyPlaceBadge
                    distanceLabel={distanceLabel}
                    isInsideRadius={insideRadius}
                    isNearby={distanceMeters !== null && distanceMeters <= 2000}
                  />
                ) : null}
              </View>
              <Text style={[styles.geoStatus, insideRadius && styles.geoStatusActive]}>
                {geoStatus}
              </Text>
              <Text style={styles.geoRadius}>Radio del lugar: {place.radiusMeters} m</Text>
              {!userLocation ? (
                <Text style={styles.geoHint}>
                  Activa la ubicación en la pantalla de lugares para ver tu distancia.
                </Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/place/[id]/chat", params: { id: place.id } })}
                style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
              >
                <Text style={styles.primaryActionText}>Abrir chat publico</Text>
              </Pressable>

              <View style={styles.actionGrid}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/place/[id]/groups", params: { id: place.id } })}
                  style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryTitle}>Grupos</Text>
                  <Text style={styles.secondaryCopy}>
                    {insights?.groupsCount ?? place.groupsCount ?? 0} comunidades
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/place/[id]/events", params: { id: place.id } })}
                  style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryTitle}>Eventos</Text>
                  <Text style={styles.secondaryCopy}>
                    {insights?.eventsCount ?? place.eventsCount ?? 0} activos
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Temas activos */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Temas activos</Text>
              {!insights || insights.topics.length === 0 ? (
                <Text style={styles.emptyHint}>
                  Aun no hay temas. Usa hashtags en el chat (#tennis, #musica) para crear temas del lugar.
                </Text>
              ) : (
                <View style={styles.topicList}>
                  {insights.topics.map((topic) => (
                    <View key={topic.id} style={styles.topicChip}>
                      <Text style={styles.topicName}>
                        #{topic.topicTag?.name ?? topic.topicTagId.slice(0, 8)}
                      </Text>
                      <Text style={styles.topicWeight}>{topic.weight}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Tu relación con este lugar */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tu relacion con este lugar</Text>
              {visitCount !== null ? (
                <>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{visitCount}</Text>
                      <Text style={styles.statLabel}>visitas tuyas</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{insights?.topics.length ?? 0}</Text>
                      <Text style={styles.statLabel}>temas activos</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {insights?.myRelatedTopics.length ?? 0}
                      </Text>
                      <Text style={styles.statLabel}>intereses compartidos</Text>
                    </View>
                  </View>
                  {lastSeenAt ? (
                    <Text style={styles.lastSeen}>
                      Última visita: {new Date(lastSeenAt).toLocaleDateString("es", {
                        day: "numeric", month: "short"
                      })}
                    </Text>
                  ) : null}
                  {insights?.myRelatedTopics && insights.myRelatedTopics.length > 0 ? (
                    <View style={styles.relatedTopics}>
                      <Text style={styles.relatedLabel}>Tus intereses aquí:</Text>
                      <View style={styles.topicList}>
                        {insights.myRelatedTopics.slice(0, 4).map((interest) => (
                          <View key={interest.id} style={[styles.topicChip, styles.topicChipMuted]}>
                            <Text style={styles.topicNameMuted}>
                              #{interest.topicTag?.name ?? interest.topicTagId.slice(0, 8)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.emptyHint}>Conecta Supabase para ver tu historial en este lugar.</Text>
              )}
            </View>
          </>
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
  actions: {
    gap: 12
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 18
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  },
  pressed: {
    opacity: 0.78
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12
  },
  secondaryAction: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minHeight: 82,
    padding: 14
  },
  secondaryTitle: {
    color: UI_COLORS.text,
    fontSize: 16,
    fontWeight: "900"
  },
  secondaryCopy: {
    color: UI_COLORS.textMuted,
    fontSize: 13
  },
  sectionCard: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  sectionTitle: {
    color: UI_COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  geoHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  geoStatus: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    fontWeight: "700"
  },
  geoStatusActive: {
    color: UI_COLORS.teal
  },
  geoRadius: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  },
  geoHint: {
    color: UI_COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17
  },
  emptyHint: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  topicList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  topicChip: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surfaceMuted,
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  topicChipMuted: {
    backgroundColor: "#f0ede4"
  },
  topicName: {
    color: UI_COLORS.primary,
    fontSize: 13,
    fontWeight: "800"
  },
  topicNameMuted: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  topicWeight: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 10,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    textAlign: "center"
  },
  statsRow: {
    flexDirection: "row",
    gap: 0
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    gap: 4
  },
  statValue: {
    color: UI_COLORS.primary,
    fontSize: 22,
    fontWeight: "900"
  },
  statLabel: {
    color: UI_COLORS.textMuted,
    fontSize: 12,
    textAlign: "center"
  },
  lastSeen: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  },
  relatedTopics: {
    gap: 8
  },
  relatedLabel: {
    color: UI_COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700"
  }
});
