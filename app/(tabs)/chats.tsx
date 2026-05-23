import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { UI_COLORS } from "../../lib/constants";
import { getNearbyPlaces } from "../../services/places";
import type { Place } from "../../types";

export default function ChatsScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getNearbyPlaces()
      .then((nextPlaces) => {
        if (isMounted) setPlaces(nextPlaces.filter((place) => (place.activeConversationsCount ?? 0) > 0));
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
          <Text style={styles.title}>Chats locales</Text>
          <Text style={styles.subtitle}>Conversaciones ligadas a lugares, no a un feed global.</Text>
        </View>

        {isLoading ? <LoadingState /> : null}

        {!isLoading && places.length === 0 ? (
          <EmptyState title="No hay chats activos" description="Los chats apareceran cuando un lugar tenga conversaciones recientes." />
        ) : null}

        <View style={styles.list}>
          {places.map((place) => (
            <Pressable
              accessibilityRole="button"
              key={place.id}
              onPress={() => router.push({ pathname: "/place/[id]/chat", params: { id: place.id } })}
              style={({ pressed }) => [styles.chatRow, pressed && styles.pressed]}
            >
              <View style={styles.chatTitleBlock}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.chatMeta}>{place.activeConversationsCount ?? 0} conversaciones abiertas</Text>
              </View>
              <Text style={styles.openText}>Abrir</Text>
            </Pressable>
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
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  list: {
    gap: 10
  },
  chatRow: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 16
  },
  pressed: {
    opacity: 0.78
  },
  chatTitleBlock: {
    flex: 1,
    gap: 4
  },
  placeName: {
    color: UI_COLORS.text,
    fontSize: 16,
    fontWeight: "800"
  },
  chatMeta: {
    color: UI_COLORS.textMuted,
    fontSize: 13
  },
  openText: {
    color: UI_COLORS.primary,
    fontSize: 14,
    fontWeight: "800"
  }
});
