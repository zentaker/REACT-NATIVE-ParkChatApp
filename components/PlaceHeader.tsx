import { StyleSheet, Text, View } from "react-native";

import { PLACE_TYPE_LABELS, UI_COLORS } from "../lib/constants";
import type { Place } from "../types";

type PlaceHeaderProps = {
  place: Place;
};

export function PlaceHeader({ place }: PlaceHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>
        {PLACE_TYPE_LABELS[place.type]} {place.city ? `en ${place.city}` : ""}
      </Text>
      <Text style={styles.title}>{place.name}</Text>
      <Text style={styles.description}>{place.description}</Text>
      <View style={styles.statusRow}>
        <Text style={styles.status}>{place.activeUsersCount ?? 0} personas recientes</Text>
        <Text style={styles.status}>{place.activeConversationsCount ?? 0} conversaciones</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10
  },
  kicker: {
    color: UI_COLORS.coral,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0
  },
  description: {
    color: UI_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  status: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    color: UI_COLORS.text,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6
  }
});
