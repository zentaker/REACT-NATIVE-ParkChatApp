import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { listEventAttendees } from "../../../services/events";
import { getProfileById } from "../../../services/profile";
import type { EventAttendee, EventAttendeeStatus, Profile } from "../../../types";

type Group = {
  status: EventAttendeeStatus;
  title: string;
  emptyLabel: string;
};

const GROUPS: Group[] = [
  { status: "going", title: "Asistiran", emptyLabel: "Nadie ha confirmado todavia." },
  { status: "interested", title: "Tal vez", emptyLabel: "Sin respuestas tentativas." },
  { status: "cancelled", title: "No asistiran", emptyLabel: "Nadie marco que no asistira." }
];

export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id ?? "");
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    listEventAttendees(eventId)
      .then(async (rows) => {
        if (!isMounted) return;
        setAttendees(rows);
        const unique = Array.from(new Set(rows.map((row) => row.userId)));
        const entries = await Promise.all(
          unique.map(async (uid) => [uid, await getProfileById(uid).catch(() => null)] as const)
        );
        if (!isMounted) return;
        setProfiles(Object.fromEntries(entries));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  function nameFor(userId: string) {
    const profile = profiles[userId];
    return profile?.displayName || profile?.username || `Usuario ${userId.slice(0, 6)}`;
  }

  const totals = GROUPS.map((group) => ({
    ...group,
    rows: attendees.filter((row) => row.status === group.status)
  }));

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Asistentes</Text>
          <Text style={styles.subtitle}>
            {totals.map((group) => `${group.title}: ${group.rows.length}`).join("  ·  ")}
          </Text>
        </View>
        <SafetyNotice message="La lista de asistentes debe respetar bloqueos, reportes y niveles de visibilidad del perfil." />

        {isLoading ? <LoadingState label="Cargando asistentes" /> : null}

        {!isLoading && attendees.length === 0 ? (
          <EmptyState title="Sin respuestas" description="Cuando alguien responda al evento aparecera aqui." />
        ) : null}

        {!isLoading && attendees.length > 0
          ? totals.map((group) => (
              <View key={group.status} style={styles.group}>
                <Text style={styles.groupTitle}>
                  {group.title} ({group.rows.length})
                </Text>
                {group.rows.length === 0 ? (
                  <Text style={styles.emptyText}>{group.emptyLabel}</Text>
                ) : (
                  group.rows.map((row) => (
                    <View key={row.id} style={styles.row}>
                      <Text style={styles.rowName}>{nameFor(row.userId)}</Text>
                      <Text style={styles.rowMeta}>
                        {new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(row.joinedAt))}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ))
          : null}
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
  header: {
    gap: 8
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  group: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  groupTitle: {
    color: UI_COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  emptyText: {
    color: UI_COLORS.textMuted,
    fontSize: 13
  },
  row: {
    borderTopColor: UI_COLORS.border,
    borderTopWidth: 1,
    paddingTop: 8
  },
  rowName: {
    color: UI_COLORS.text,
    fontSize: 14,
    fontWeight: "700"
  },
  rowMeta: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  }
});
