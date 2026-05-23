import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../../components/EmptyState";
import { GroupCard } from "../../../components/GroupCard";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { ACCESS_LEVEL_LABELS, UI_COLORS } from "../../../lib/constants";
import { getGroupById, joinGroup } from "../../../services/groups";
import type { LocalGroup } from "../../../types";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id ?? "");
  const [group, setGroup] = useState<LocalGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getGroupById(groupId)
      .then((nextGroup) => {
        if (isMounted) setGroup(nextGroup);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  async function handleJoin() {
    setIsJoining(true);
    try {
      await joinGroup(groupId);
      Alert.alert("Solicitud registrada", "La membresia se guardo o quedo simulada en modo mock.");
    } catch (error) {
      Alert.alert("No se pudo unir", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <LoadingState label="Cargando grupo" /> : null}

        {!isLoading && !group ? <EmptyState title="Grupo no encontrado" description="No existe en mocks ni en Supabase." /> : null}

        {group ? (
          <>
            <GroupCard group={group} />
            <SafetyNotice message="Este grupo puede aplicar reglas de acceso, moderacion y reportes segun su nivel de seguridad." />

            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Acceso</Text>
              <Text style={styles.detailText}>{ACCESS_LEVEL_LABELS[group.accessLevel]}</Text>
              <Text style={styles.detailCopy}>{group.description}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isJoining}
              onPress={handleJoin}
              style={({ pressed }) => [styles.primaryButton, (pressed || isJoining) && styles.pressed]}
            >
              <Text style={styles.primaryText}>{isJoining ? "Procesando..." : "Unirme o solicitar acceso"}</Text>
            </Pressable>

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
                <Text style={styles.secondaryText}>Ajustes</Text>
              </Pressable>
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
  detailCard: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  sectionTitle: {
    color: UI_COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  detailText: {
    color: UI_COLORS.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  detailCopy: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  pressed: {
    opacity: 0.78
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10
  },
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
  secondaryText: {
    color: UI_COLORS.primary,
    fontSize: 13,
    fontWeight: "900"
  }
});
