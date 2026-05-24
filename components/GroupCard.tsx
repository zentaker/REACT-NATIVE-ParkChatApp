import { Pressable, StyleSheet, Text, View } from "react-native";

import { ACCESS_LEVEL_LABELS, UI_COLORS } from "../lib/constants";
import type { LocalGroup } from "../types";

type GroupCardProps = {
  group: LocalGroup;
  onPress?: () => void;
  pendingCount?: number;
};

export function GroupCard({ group, onPress, pendingCount }: GroupCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{group.name}</Text>
        <View style={styles.headerRight}>
          {pendingCount != null && pendingCount > 0 ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{pendingCount} pendiente{pendingCount === 1 ? "" : "s"}</Text>
            </View>
          ) : null}
          <Text style={styles.access}>{ACCESS_LEVEL_LABELS[group.accessLevel]}</Text>
        </View>
      </View>
      {group.description ? (
        <Text numberOfLines={2} style={styles.description}>
          {group.description}
        </Text>
      ) : null}
      <Text style={styles.memberCount}>{group.memberCount} miembro{group.memberCount === 1 ? "" : "s"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
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
  headerRight: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 6
  },
  name: {
    color: UI_COLORS.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "800"
  },
  pendingBadge: {
    backgroundColor: "#fdf0eb",
    borderColor: UI_COLORS.coral + "44",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  pendingText: {
    color: UI_COLORS.coral,
    fontSize: 11,
    fontWeight: "800"
  },
  access: {
    backgroundColor: "#eef2e4",
    borderRadius: 999,
    color: UI_COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  description: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  memberCount: {
    color: UI_COLORS.text,
    fontSize: 13,
    fontWeight: "700"
  }
});
