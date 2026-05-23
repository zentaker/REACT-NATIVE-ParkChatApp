import { Pressable, StyleSheet, Text, View } from "react-native";

import { PLACE_TYPE_LABELS, UI_COLORS } from "../lib/constants";
import type { Place } from "../types";

type PlaceCardProps = {
  place: Place;
  onPress?: () => void;
};

export function PlaceCard({ place, onPress }: PlaceCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.meta}>
            {PLACE_TYPE_LABELS[place.type]} {place.city ? `en ${place.city}` : ""}
          </Text>
        </View>
        <View style={styles.activePill}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>{place.activeUsersCount ?? 0}</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.description}>
        {place.description}
      </Text>

      <View style={styles.statsRow}>
        <Text style={styles.stat}>{place.activeConversationsCount ?? 0} conversaciones</Text>
        <Text style={styles.stat}>{place.groupsCount ?? 0} grupos</Text>
        <Text style={styles.stat}>{place.eventsCount ?? 0} eventos</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  pressed: {
    opacity: 0.78
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  titleBlock: {
    flex: 1,
    gap: 4
  },
  name: {
    color: UI_COLORS.text,
    fontSize: 18,
    fontWeight: "700"
  },
  meta: {
    color: UI_COLORS.textMuted,
    fontSize: 13
  },
  activePill: {
    alignItems: "center",
    backgroundColor: "#e7f0eb",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activeDot: {
    backgroundColor: UI_COLORS.success,
    borderRadius: 4,
    height: 8,
    width: 8
  },
  activeText: {
    color: UI_COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "700"
  },
  description: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  stat: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderRadius: 999,
    color: UI_COLORS.text,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6
  }
});
