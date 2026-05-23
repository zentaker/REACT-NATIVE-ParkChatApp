import { router } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { PlaceCard } from "../../components/PlaceCard";
import { SafetyNotice } from "../../components/SafetyNotice";
import { UI_COLORS } from "../../lib/constants";
import { getNearbyPlaces } from "../../services/places";
import type { Place } from "../../types";

export default function SpacesScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadPlaces() {
    const nextPlaces = await getNearbyPlaces();
    setPlaces(nextPlaces);
  }

  useEffect(() => {
    let isMounted = true;

    getNearbyPlaces()
      .then((nextPlaces) => {
        if (isMounted) setPlaces(nextPlaces);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadPlaces();
    setIsRefreshing(false);
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} tintColor={UI_COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Etapa 0</Text>
          <Text style={styles.title}>Espacios cercanos</Text>
          <Text style={styles.subtitle}>Entra al espacio digital de un lugar fisico y mira que esta conversando la comunidad.</Text>
        </View>

        <SafetyNotice />

        {isLoading ? <LoadingState /> : null}

        {!isLoading && places.length === 0 ? (
          <EmptyState title="No hay lugares aun" description="Cuando conectes Supabase, apareceran espacios cercanos desde Postgres." />
        ) : null}

        <View style={styles.list}>
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              onPress={() => router.push({ pathname: "/place/[id]", params: { id: place.id } })}
              place={place}
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
  kicker: {
    color: UI_COLORS.coral,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
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
    gap: 12
  }
});
