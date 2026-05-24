import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { LoadingState } from "../../../components/LoadingState";
import { PlaceHeader } from "../../../components/PlaceHeader";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { getPlaceTopics, upsertUserPlace } from "../../../services/graph";
import { getPlaceById } from "../../../services/places";
import type { PlaceTopic } from "../../../types/graph";
import type { Place } from "../../../types";

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");
  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topics, setTopics] = useState<PlaceTopic[]>([]);
  const [visitCount, setVisitCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    getPlaceById(placeId)
      .then((nextPlace) => {
        if (isMounted) setPlace(nextPlace);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    upsertUserPlace(placeId, "visited")
      .then((userPlace) => {
        if (isMounted && userPlace) setVisitCount(userPlace.visitCount);
      })
      .catch(() => {});

    getPlaceTopics(placeId, 8)
      .then((nextTopics) => {
        if (isMounted) setTopics(nextTopics);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [placeId]);

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
                  <Text style={styles.secondaryCopy}>{place.groupsCount ?? 0} comunidades</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/place/[id]/events", params: { id: place.id } })}
                  style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryTitle}>Eventos</Text>
                  <Text style={styles.secondaryCopy}>{place.eventsCount ?? 0} activos</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Temas activos</Text>
              {topics.length === 0 ? (
                <Text style={styles.emptyHint}>
                  Aun no hay temas. Usa hashtags en el chat (#tennis, #musica) para crear temas del lugar.
                </Text>
              ) : (
                <View style={styles.topicList}>
                  {topics.map((topic) => (
                    <View key={topic.id} style={styles.topicChip}>
                      <Text style={styles.topicName}>#{topic.topicTag?.name ?? topic.topicTagId.slice(0, 8)}</Text>
                      <Text style={styles.topicWeight}>{topic.weight}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tu relacion con este lugar</Text>
              {visitCount !== null ? (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{visitCount}</Text>
                    <Text style={styles.statLabel}>visitas tuyas</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{topics.length}</Text>
                    <Text style={styles.statLabel}>temas activos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{place.groupsCount ?? 0}</Text>
                    <Text style={styles.statLabel}>grupos</Text>
                  </View>
                </View>
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
    gap: 12,
    padding: 16
  },
  sectionTitle: {
    color: UI_COLORS.text,
    fontSize: 17,
    fontWeight: "900"
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
  topicName: {
    color: UI_COLORS.primary,
    fontSize: 13,
    fontWeight: "800"
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
  }
});
