import { Stack, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { SafetyNotice } from "../components/SafetyNotice";
import { UI_COLORS } from "../lib/constants";
import { listBlockedProfiles, unblockUser, type BlockedProfile } from "../services/moderation";

export default function BlocksScreen() {
  const [items, setItems] = useState<BlockedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await listBlockedProfiles();
      setItems(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function confirmUnblock(item: BlockedProfile) {
    const name = item.profile?.displayName ?? item.profile?.username ?? "esta cuenta";
    Alert.alert(
      "Desbloquear",
      `Volveras a ver mensajes y publicaciones de ${name}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desbloquear",
          style: "default",
          onPress: async () => {
            setPendingId(item.blockedId);
            try {
              await unblockUser(item.blockedId);
              setItems((current) => current.filter((row) => row.blockedId !== item.blockedId));
            } catch (error) {
              Alert.alert("No se pudo desbloquear", error instanceof Error ? error.message : "Intentalo otra vez.");
            } finally {
              setPendingId(null);
            }
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: "Mis bloqueos" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis bloqueos</Text>
          <Text style={styles.subtitle}>
            Estas cuentas no aparecen en tus chats. El filtro tambien se aplica en Supabase con RLS para que sea efectivo
            en todos los clientes.
          </Text>
        </View>

        <SafetyNotice
          tone="default"
          title="Como funciona"
          message="Cuando bloqueas a alguien, sus mensajes desaparecen de los chats de lugar al instante y deja de poder ver los tuyos. Puedes desbloquear cuando quieras."
        />

        {isLoading ? <LoadingState label="Cargando bloqueos" /> : null}

        {!isLoading && items.length === 0 ? (
          <EmptyState title="Sin bloqueos" description="No tienes cuentas bloqueadas todavia." />
        ) : null}

        <View style={styles.list}>
          {items.map((item) => {
            const name = item.profile?.displayName ?? item.profile?.username ?? "Cuenta sin nombre";
            const handle = item.profile?.username ? `@${item.profile.username}` : item.blockedId.slice(0, 8);
            const isPending = pendingId === item.blockedId;
            return (
              <View key={item.blockedId} style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/profile/[id]", params: { id: item.blockedId } })}
                  style={styles.rowInfo}
                >
                  <Text style={styles.rowName}>{name}</Text>
                  <Text style={styles.rowMeta}>{handle}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isPending}
                  onPress={() => confirmUnblock(item)}
                  style={[styles.unblockButton, isPending && styles.disabled]}
                >
                  <Text style={styles.unblockText}>{isPending ? "..." : "Desbloquear"}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
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
    fontSize: 26,
    fontWeight: "900"
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  list: {
    gap: 10
  },
  row: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 14
  },
  rowInfo: {
    flex: 1,
    gap: 2
  },
  rowName: {
    color: UI_COLORS.text,
    fontSize: 15,
    fontWeight: "800"
  },
  rowMeta: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  },
  unblockButton: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderColor: UI_COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  unblockText: {
    color: UI_COLORS.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.55
  }
});
