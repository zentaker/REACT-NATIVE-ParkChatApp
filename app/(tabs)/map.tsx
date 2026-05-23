import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingState } from "../../components/LoadingState";
import { PlaceCard } from "../../components/PlaceCard";
import { SafetyNotice } from "../../components/SafetyNotice";
import { UI_COLORS } from "../../lib/constants";
import { getNearbyPlaces } from "../../services/places";
import type { Place } from "../../types";

export default function MapScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapTitle}>Mapa vivo</Text>
          <Text style={styles.mapCopy}>
            En esta etapa se valida el flujo con lista de espacios. La capa de mapa real queda preparada para Etapa 1.
          </Text>
        </View>

        <SafetyNotice message="Mostramos actividad agregada por lugar, no la posicion exacta de personas." />

        {isLoading ? <LoadingState /> : null}

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
  mapPlaceholder: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    gap: 10,
    minHeight: 190,
    justifyContent: "flex-end",
    padding: 18
  },
  mapTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  mapCopy: {
    color: "#f5f2ea",
    fontSize: 15,
    lineHeight: 22
  },
  list: {
    gap: 12
  }
});
