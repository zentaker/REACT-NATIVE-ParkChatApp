import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { UI_COLORS } from "../lib/constants";
import type { PlaceWithDistance } from "../services/places";
import type { UserLocation } from "../types/location";

const DEFAULT_REGION = {
  latitude: -12.1219,
  longitude: -77.0309,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08
};

type Props = {
  places: PlaceWithDistance[];
  userLocation?: UserLocation | null;
};

export function PlacesMapView({ places, userLocation }: Props) {
  const centerLat = userLocation?.latitude ?? places[0]?.latitude ?? DEFAULT_REGION.latitude;
  const centerLng = userLocation?.longitude ?? places[0]?.longitude ?? DEFAULT_REGION.longitude;

  const region = {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06
  };

  return (
    <View style={styles.container}>
      <MapView initialRegion={region} style={styles.map}>
        {places.map((place) => (
          <Marker
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            description={place.city ?? undefined}
            key={place.id}
            onCalloutPress={() =>
              router.push({ pathname: "/place/[id]", params: { id: place.id } })
            }
            pinColor={place.isInsideRadius ? UI_COLORS.teal : UI_COLORS.primary}
            title={place.name}
          />
        ))}
      </MapView>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: UI_COLORS.teal }]} />
          <Text style={styles.legendText}>Dentro del área</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: UI_COLORS.primary }]} />
          <Text style={styles.legendText}>Lugar disponible</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  map: {
    height: 280,
    width: "100%"
  },
  legend: {
    backgroundColor: UI_COLORS.surface,
    flexDirection: "row",
    gap: 16,
    padding: 10,
    paddingHorizontal: 14
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10
  },
  legendText: {
    color: UI_COLORS.textMuted,
    fontSize: 11
  }
});
