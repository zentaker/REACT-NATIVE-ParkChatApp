import { StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

type Props = {
  distanceLabel: string;
  isInsideRadius?: boolean;
  isNearby?: boolean;
};

export function NearbyPlaceBadge({ distanceLabel, isInsideRadius, isNearby }: Props) {
  const color = isInsideRadius
    ? UI_COLORS.teal
    : isNearby
    ? UI_COLORS.primary
    : UI_COLORS.textMuted;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{distanceLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  dot: {
    borderRadius: 4,
    height: 7,
    width: 7
  },
  label: {
    fontSize: 11,
    fontWeight: "700"
  }
});
