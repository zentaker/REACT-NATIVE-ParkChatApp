import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { EventCard } from "../../../components/EventCard";
import { GroupCard } from "../../../components/GroupCard";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { ACCESS_LEVEL_LABELS, UI_COLORS } from "../../../lib/constants";
import { getCurrentUserId } from "../../../services/auth";
import { getEventsByGroup } from "../../../services/events";
import { getGroupById, getMyGroupMembership, joinGroup, leaveGroup } from "../../../services/groups";
import type { GroupMember, LocalEvent, LocalGroup } from "../../../types";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id ?? "");
  const [group, setGroup] = useState<LocalGroup | null>(null);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [membership, setMembership] = useState<GroupMember | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  async function refresh() {
    const [nextGroup, nextEvents, nextMembership, userId] = await Promise.all([
      getGroupById(groupId),
      getEventsByGroup(groupId),
      getMyGroupMembership(groupId),
      getCurrentUserId().catch(() => null)
    ]);
    setGroup(nextGroup);
    setEvents(nextEvents);
    setMembership(nextMembership);
    setIsOwner(Boolean(nextGroup && userId && nextGroup.createdBy === userId));
  }

  useEffect(() => {
    let isMounted = true;
    refresh().finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [groupId]);

  async function handleJoin() {
    setIsWorking(true);
    try {
      const next = await joinGroup(groupId);
      setMembership(next);
    } catch (error) {
      Alert.alert("No se pudo unir", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleLeave() {
    setIsWorking(true);
    try {
      await leaveGroup(groupId);
      setMembership(null);
    } catch (error) {
      Alert.alert("No se pudo salir", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsWorking(false);
    }
  }

  const isMember = membership !== null;

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <LoadingState label="Cargando grupo" /> : null}

        {!isLoading && !group ? (
          <EmptyState title="Grupo no encontrado" description="No existe en mocks ni en Supabase." />
        ) : null}

        {group ? (
          <>
            <GroupCard group={group} />
            <SafetyNotice message="Este grupo aplica reglas de acceso, moderacion y reportes segun su nivel de seguridad." />

            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Acceso</Text>
              <Text style={styles.detailText}>{ACCESS_LEVEL_LABELS[group.accessLevel]}</Text>
              {group.description ? <Text style={styles.detailCopy}>{group.description}</Text> : null}
            </View>

            {isMember ? (
              <Pressable
                accessibilityRole="button"
                disabled={isWorking}
                onPress={handleLeave}
                style={({ pressed }) => [styles.secondaryWide, (pressed || isWorking) && styles.pressed]}
              >
                <Text style={styles.secondaryWideText}>{isWorking ? "Procesando..." : "Salir del grupo"}</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isWorking}
                onPress={handleJoin}
                style={({ pressed }) => [styles.primaryButton, (pressed || isWorking) && styles.pressed]}
              >
                <Text style={styles.primaryText}>{isWorking ? "Procesando..." : "Unirme al grupo"}</Text>
              </Pressable>
            )}

            <View style={styles.actionGrid}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/group/[id]/chat", params: { id: group.id } })}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Chat</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/group/[id]/members", params: { id: group.id } })}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Miembros</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/group/[id]/settings", params: { id: group.id } })}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>{isOwner ? "Editar" : "Ajustes"}</Text>
              </Pressable>
            </View>

            <View style={styles.eventsHeader}>
              <Text style={styles.sectionTitle}>Eventos del grupo</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/group/[id]/new-event" as never, params: { id: group.id } as never })}
                style={({ pressed }) => [styles.createSmall, pressed && styles.pressed]}
              >
                <Text style={styles.createSmallText}>Crear evento</Text>
              </Pressable>
            </View>

            {events.length === 0 ? (
              <EmptyState title="Sin eventos" description="Crea un evento para que la comunidad se encuentre." />
            ) : (
              <View style={styles.eventsList}>
                {events.map((event) => (
                  <EventCard
                    event={event}
                    key={event.id}
                    onPress={() => router.push({ pathname: "/event/[id]", params: { id: event.id } })}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: UI_COLORS.background, flex: 1 },
  content: { gap: 18, padding: 18, paddingBottom: 32 },
  detailCard: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  sectionTitle: { color: UI_COLORS.text, fontSize: 17, fontWeight: "900" },
  detailText: { color: UI_COLORS.primary, fontSize: 15, fontWeight: "900" },
  detailCopy: { color: UI_COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  primaryText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
  secondaryWide: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  secondaryWideText: { color: UI_COLORS.primary, fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.78 },
  actionGrid: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  secondaryText: { color: UI_COLORS.primary, fontSize: 13, fontWeight: "900" },
  eventsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  createSmall: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  createSmallText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  eventsList: { gap: 12 }
});
