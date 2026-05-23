import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { EventCard } from "../../components/EventCard";
import { LoadingState } from "../../components/LoadingState";
import { UI_COLORS } from "../../lib/constants";
import { getMyEvents } from "../../services/events";
import type { LocalEvent } from "../../types";

export default function MyEventsScreen() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMyEvents()
      .then((next) => {
        if (isMounted) setEvents(next);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis eventos</Text>
          <Text style={styles.subtitle}>Eventos que creaste o donde confirmaste asistencia.</Text>
        </View>

        {isLoading ? <LoadingState label="Cargando eventos" /> : null}

        {!isLoading && events.length === 0 ? (
          <EmptyState title="Sin eventos todavia" description="Crea o confirma asistencia a un evento para verlo aqui." />
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
  screen: { backgroundColor: UI_COLORS.background, flex: 1 },
  content: { gap: 18, padding: 18, paddingBottom: 32 },
  header: { gap: 8 },
  title: { color: UI_COLORS.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: UI_COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  list: { gap: 12 }
});
