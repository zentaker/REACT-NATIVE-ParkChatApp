import { Pressable, StyleSheet, Text, View } from "react-native";

import { ACCESS_LEVEL_LABELS, UI_COLORS } from "../lib/constants";
import type { LocalEvent } from "../types";

type EventCardProps = {
  event: LocalEvent;
  onPress?: () => void;
  goingCount?: number;
  maybeCount?: number;
  myRsvpStatus?: string | null;
};

const RSVP_LABELS: Record<string, string> = {
  going: "Voy",
  maybe: "Quizás",
  declined: "No voy"
};

const RSVP_COLORS: Record<string, string> = {
  going: "#22a547",
  maybe: UI_COLORS.amber,
  declined: UI_COLORS.coral
};

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function EventCard({ event, onPress, goingCount, maybeCount, myRsvpStatus }: EventCardProps) {
  const hasCounters = typeof goingCount === "number" || typeof maybeCount === "number";

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.headerRight}>
          {myRsvpStatus ? (
            <View style={[styles.rsvpPill, { backgroundColor: (RSVP_COLORS[myRsvpStatus] ?? UI_COLORS.textMuted) + "22" }]}>
              <Text style={[styles.rsvpPillText, { color: RSVP_COLORS[myRsvpStatus] ?? UI_COLORS.textMuted }]}>
                {RSVP_LABELS[myRsvpStatus] ?? myRsvpStatus}
              </Text>
            </View>
          ) : null}
          <Text style={styles.access}>{ACCESS_LEVEL_LABELS[event.accessLevel]}</Text>
        </View>
      </View>
      <Text style={styles.date}>{formatEventDate(event.startsAt)}</Text>
      {event.description ? (
        <Text numberOfLines={2} style={styles.description}>
          {event.description}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.capacity}>{event.capacity ? `${event.capacity} cupos` : "Sin limite definido"}</Text>
        {hasCounters ? (
          <View style={styles.counters}>
            {typeof goingCount === "number" ? (
              <Text style={styles.counter}>
                <Text style={styles.counterNum}>{goingCount}</Text> van
              </Text>
            ) : null}
            {typeof maybeCount === "number" && maybeCount > 0 ? (
              <Text style={styles.counter}>
                <Text style={styles.counterNum}>{maybeCount}</Text> quizás
              </Text>
            ) : null}
          </View>
        ) : null}
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
  title: {
    color: UI_COLORS.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "800"
  },
  rsvpPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  rsvpPillText: {
    fontSize: 11,
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
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  capacity: {
    color: UI_COLORS.text,
    fontSize: 13,
    fontWeight: "700"
  },
  counters: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  counter: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  },
  counterNum: {
    color: UI_COLORS.text,
    fontWeight: "800"
  }
});
