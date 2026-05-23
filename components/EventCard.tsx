import { Pressable, StyleSheet, Text, View } from "react-native";

import { ACCESS_LEVEL_LABELS, UI_COLORS } from "../lib/constants";
import type { LocalEvent } from "../types";

type EventCardProps = {
  event: LocalEvent;
  onPress?: () => void;
};

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function EventCard({ event, onPress }: EventCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.access}>{ACCESS_LEVEL_LABELS[event.accessLevel]}</Text>
      </View>
      <Text style={styles.date}>{formatEventDate(event.startsAt)}</Text>
      <Text numberOfLines={2} style={styles.description}>
        {event.description}
      </Text>
      <Text style={styles.capacity}>{event.capacity ? `${event.capacity} cupos` : "Sin limite definido"}</Text>
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
  title: {
    color: UI_COLORS.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "800"
  },
  access: {
    backgroundColor: "#f3e7d0",
    borderRadius: 999,
    color: UI_COLORS.amber,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  date: {
    color: UI_COLORS.primary,
    fontSize: 13,
    fontWeight: "800"
  },
  description: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  capacity: {
    color: UI_COLORS.text,
    fontSize: 13,
    fontWeight: "700"
  }
});
