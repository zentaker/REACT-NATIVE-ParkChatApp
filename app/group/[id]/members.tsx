import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { getCurrentUserId } from "../../../services/auth";
import {
  approveGroupMember,
  getGroupById,
  getGroupMembers,
  rejectGroupMember,
  type GroupMemberWithProfile
} from "../../../services/groups";
import type { LocalGroup } from "../../../types";

export default function GroupMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id ?? "");

  const [group, setGroup] = useState<LocalGroup | null>(null);
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workingUserId, setWorkingUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [nextGroup, nextMembers, userId] = await Promise.all([
      getGroupById(groupId),
      getGroupMembers(groupId),
      getCurrentUserId().catch(() => null)
    ]);
    setGroup(nextGroup);
    setMembers(nextMembers);
    const ownerByCreator = Boolean(nextGroup && userId && nextGroup.createdBy === userId);
    const ownerByRole = nextMembers.some(
      (m) => m.userId === userId && m.role === "owner" && m.status === "active"
    );
    setIsOwner(ownerByCreator || ownerByRole || !isSupabaseConfigured);
  }, [groupId]);

  useEffect(() => {
    let isMounted = true;
    refresh().finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refresh]);

  async function handleApprove(userId: string) {
    setWorkingUserId(userId);
    try {
      await approveGroupMember(groupId, userId);
      await refresh();
    } catch (error) {
      Alert.alert("No se pudo aprobar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setWorkingUserId(null);
    }
  }

  async function handleReject(userId: string) {
    setWorkingUserId(userId);
    try {
      await rejectGroupMember(groupId, userId);
      await refresh();
    } catch (error) {
      Alert.alert("No se pudo rechazar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setWorkingUserId(null);
    }
  }

  const pending = members.filter((m) => m.status === "pending");
  const active = members.filter((m) => m.status === "active");

  function memberLabel(member: GroupMemberWithProfile): string {
    return (
      member.profile?.displayName ||
      member.profile?.username ||
      `Aldeano ${member.userId.slice(0, 6)}`
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Miembros</Text>
          <Text style={styles.subtitle}>{group?.name ?? `Grupo ${groupId}`}</Text>
        </View>
        <SafetyNotice message="La lista de miembros debe respetar privacidad y puede ocultar presencia exacta por safety mode." />

        {isLoading ? <LoadingState label="Cargando miembros" /> : null}

        {!isLoading ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
                <Text style={styles.sectionBadge}>{pending.length}</Text>
              </View>
              {pending.length === 0 ? (
                <EmptyState
                  title="Sin solicitudes"
                  description="Cuando alguien pida unirse al grupo, aparecera aqui para aprobar o rechazar."
                />
              ) : (
                <View style={styles.list}>
                  {pending.map((member) => {
                    const busy = workingUserId === member.userId;
                    return (
                      <View key={member.userId} style={styles.memberRow}>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{memberLabel(member)}</Text>
                          <Text style={styles.memberMeta}>
                            Solicito el {new Date(member.joinedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        {isOwner ? (
                          <View style={styles.actions}>
                            <Pressable
                              accessibilityRole="button"
                              disabled={busy}
                              onPress={() => handleApprove(member.userId)}
                              style={({ pressed }) => [
                                styles.approveBtn,
                                (pressed || busy) && styles.pressed
                              ]}
                            >
                              <Text style={styles.approveText}>{busy ? "..." : "Aprobar"}</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              disabled={busy}
                              onPress={() => handleReject(member.userId)}
                              style={({ pressed }) => [
                                styles.rejectBtn,
                                (pressed || busy) && styles.pressed
                              ]}
                            >
                              <Text style={styles.rejectText}>{busy ? "..." : "Rechazar"}</Text>
                            </Pressable>
                          </View>
                        ) : (
                          <Text style={styles.memberMeta}>Pendiente</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Miembros activos</Text>
                <Text style={styles.sectionBadge}>{active.length}</Text>
              </View>
              {active.length === 0 ? (
                <EmptyState title="Aun no hay miembros activos" description="Las solicitudes aprobadas apareceran aqui." />
              ) : (
                <View style={styles.list}>
                  {active.map((member) => (
                    <View key={member.userId} style={styles.memberRow}>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{memberLabel(member)}</Text>
                        <Text style={styles.memberMeta}>
                          {member.role === "owner"
                            ? "Dueno"
                            : member.role === "moderator"
                              ? "Moderador"
                              : "Miembro"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
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
    fontWeight: "900"
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 14
  },
  section: {
    gap: 10
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: UI_COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  sectionBadge: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    color: UI_COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  list: {
    gap: 10
  },
  memberRow: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14
  },
  memberInfo: {
    flex: 1,
    gap: 2
  },
  memberName: {
    color: UI_COLORS.text,
    fontSize: 15,
    fontWeight: "800"
  },
  memberMeta: {
    color: UI_COLORS.textMuted,
    fontSize: 13
  },
  actions: {
    flexDirection: "row",
    gap: 8
  },
  approveBtn: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  approveText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  rejectBtn: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  rejectText: {
    color: UI_COLORS.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  pressed: { opacity: 0.78 }
});
