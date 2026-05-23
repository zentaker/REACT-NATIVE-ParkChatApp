import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { EventCard } from "../../../components/EventCard";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { getEventsByPlace } from "../../../services/events";
import type { LocalEvent } from "../../../types";

export default function PlaceEventsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getEventsByPlace(placeId)
      .then((nextEvents) => {
        if (isMounted) setEvents(nextEvents);
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
        <View style={styles.header}>
          <Text style={styles.title}>Eventos del lugar</Text>
          <Text style={styles.subtitle}>Encuentros espontaneos nacidos desde un espacio o una conversacion.</Text>
        </View>

        <SafetyNotice message="Prioriza lugares publicos, reglas claras y anfitriones identificables para los eventos presenciales." />

        <Pressable accessibilityRole="button" style={styles.createButton}>
          <Text style={styles.createText}>Crear evento</Text>
        </Pressable>

        {isLoading ? <LoadingState label="Cargando eventos" /> : null}

        {!isLoading && events.length === 0 ? (
          <EmptyState title="Sin eventos todavia" description="La Etapa 1 conectara creacion real de eventos con Supabase." />
        ) : null}

        <View style={styles.list}>
          {events.map((event) => (
            <EventCard
              event={event}
              key={event.id}
              onPress={() => router.push({ pathname: "/event/[id]", params: { id: event.id } })}
            />
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
    gap: 8
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  createButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  createText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  list: {
    gap: 12
  }
});
