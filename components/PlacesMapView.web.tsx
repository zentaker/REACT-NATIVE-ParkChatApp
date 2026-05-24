import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { NearbyPlaceBadge } from "./NearbyPlaceBadge";
import { UI_COLORS, PLACE_TYPE_LABELS } from "../lib/constants";
import type { PlaceWithDistance } from "../services/places";

type Props = {
  places: PlaceWithDistance[];
};

export function PlacesMapView({ places }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Vista de lista</Text>
        <Text style={styles.headerSub}>El mapa interactivo está disponible en la app móvil</Text>
      </View>
      <View style={styles.list}>
        {places.map((place) => (
          <Pressable
            accessibilityRole="button"
            key={place.id}
            onPress={() => router.push({ pathname: "/place/[id]", params: { id: place.id } })}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowContent}>
              <View style={styles.dot} />
              <View style={styles.rowText}>
                <Text style={styles.name}>{place.name}</Text>
                <Text style={styles.meta}>
                  {PLACE_TYPE_LABELS[place.type]}
                  {place.city ? ` · ${place.city}` : ""}
                </Text>
              </View>
              {place.distanceLabel ? (
                <NearbyPlaceBadge
                  distanceLabel={place.distanceLabel}
                  isInsideRadius={place.isInsideRadius}
                  isNearby={place.isNearby}
                />
              ) : null}
            </View>
          </Pressable>
        ))}
        {places.length === 0 ? (
          <Text style={styles.empty}>No hay lugares disponibles.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  header: {
    backgroundColor: UI_COLORS.primary,
    gap: 4,
    padding: 16
  },
  headerText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  headerSub: {
    color: "#d5ebe6",
    fontSize: 12
  },
  list: {
    gap: 0
  },
  row: {
    borderBottomColor: UI_COLORS.border,
    borderBottomWidth: 1,
    padding: 14
  },
  pressed: {
    backgroundColor: UI_COLORS.surfaceMuted
  },
  rowContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  dot: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 6,
    height: 12,
    width: 12
  },
  rowText: {
    flex: 1,
    gap: 2
  },
  name: {
    color: UI_COLORS.text,
    fontSize: 14,
    fontWeight: "700"
  },
  meta: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  },
  empty: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    padding: 16,
    textAlign: "center"
  }
});
