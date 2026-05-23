import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { LoadingState } from "../../../components/LoadingState";
import { PlaceHeader } from "../../../components/PlaceHeader";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { getPlaceById } from "../../../services/places";
import type { Place } from "../../../types";

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");
  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getPlaceById(placeId)
      .then((nextPlace) => {
        if (isMounted) setPlace(nextPlace);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

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

            <View style={styles.communityCard}>
              <Text style={styles.sectionTitle}>Estado de comunidad</Text>
              <Text style={styles.communityText}>
                Este lugar valida el flujo base del MVP: lugar fisico, conversacion local, grupo o evento asociado.
              </Text>
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
  communityCard: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  sectionTitle: {
    color: UI_COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  communityText: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
