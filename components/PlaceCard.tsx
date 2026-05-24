import { Pressable, StyleSheet, Text, View } from "react-native";

import { PLACE_TYPE_LABELS, UI_COLORS } from "../lib/constants";
import type { Place } from "../types";

type PlaceCardProps = {
  place: Place;
  onPress?: () => void;
};

export function PlaceCard({ place, onPress }: PlaceCardProps) {
  const hasActivity =
    (place.activeUsersCount ?? 0) > 0 ||
    (place.activeConversationsCount ?? 0) > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
          <Text style={styles.meta}>
            {PLACE_TYPE_LABELS[place.type]}{place.city ? ` · ${place.city}` : ""}
          </Text>
        </View>
        <View style={[styles.activePill, !hasActivity && styles.activePillMuted]}>
          <View style={[styles.activeDot, !hasActivity && styles.activeDotMuted]} />
          <Text style={[styles.activeText, !hasActivity && styles.activeTextMuted]}>
            {place.activeUsersCount ?? 0}
          </Text>
        </View>
      </View>

      {place.description ? (
        <Text numberOfLines={2} style={styles.description}>
          {place.description}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        {(place.activeConversationsCount ?? 0) > 0 ? (
          <View style={styles.statChip}>
            <Text style={styles.statText}>💬 {place.activeConversationsCount}</Text>
          </View>
        ) : null}
        {(place.groupsCount ?? 0) > 0 ? (
          <View style={styles.statChip}>
            <Text style={styles.statText}>👥 {place.groupsCount} grupos</Text>
          </View>
        ) : null}
        {(place.eventsCount ?? 0) > 0 ? (
          <View style={styles.statChip}>
            <Text style={styles.statText}>📅 {place.eventsCount} eventos</Text>
          </View>
        ) : null}
        {(place.activeConversationsCount ?? 0) === 0 && (place.groupsCount ?? 0) === 0 && (place.eventsCount ?? 0) === 0 ? (
          <View style={styles.statChip}>
            <Text style={styles.statText}>Sé el primero en participar</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.cta}>Ver comunidad →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
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
    gap: 3
  },
  name: {
    color: UI_COLORS.text,
    fontSize: 18,
    fontWeight: "800"
  },
  meta: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  },
  activePill: {
    alignItems: "center",
    backgroundColor: "#e7f0eb",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  activePillMuted: {
    backgroundColor: UI_COLORS.surfaceMuted
  },
  activeDot: {
    backgroundColor: UI_COLORS.success,
    borderRadius: 4,
    height: 8,
    width: 8
  },
  activeDotMuted: {
    backgroundColor: UI_COLORS.textMuted
  },
  activeText: {
    color: UI_COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "700"
  },
  activeTextMuted: {
    color: UI_COLORS.textMuted
  },
  description: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  statChip: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  statText: {
    color: UI_COLORS.text,
    fontSize: 12
  },
  footer: {
    borderTopColor: UI_COLORS.border,
    borderTopWidth: 1,
    marginTop: 2,
    paddingTop: 10
  },
  cta: {
    color: UI_COLORS.primary,
    fontSize: 13,
    fontWeight: "800"
  }
});
