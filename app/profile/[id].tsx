import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { ReportDialog } from "../../components/ReportDialog";
import { SafetyNotice } from "../../components/SafetyNotice";
import { useAuth } from "../../hooks/useAuth";
import { useBlockedUsers } from "../../hooks/useBlockedUsers";
import { UI_COLORS } from "../../lib/constants";
import { blockUser, reportContent, unblockUser, type ReportReason } from "../../services/moderation";
import { getProfileById } from "../../services/profile";
import type { Profile } from "../../types";

export default function OtherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = String(id ?? "");
  const { user } = useAuth();
  const isSelf = Boolean(user?.id && user.id === userId);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isMutatingBlock, setIsMutatingBlock] = useState(false);

  const { isBlocked, markBlocked, markUnblocked } = useBlockedUsers();
  const blocked = isBlocked(userId);

  useEffect(() => {
    let isMounted = true;

    getProfileById(userId)
      .then((next) => {
        if (isMounted) setProfile(next);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  async function handleSubmitReport(reason: ReportReason, details: string) {
    setIsSubmittingReport(true);
    try {
      await reportContent({
        targetType: "profile",
        targetId: userId,
        reason,
        details: details || null
      });
      setReportOpen(false);
      Alert.alert("Reporte enviado", "Gracias. Revisaremos esta cuenta. Tu identidad no se comparte.");
    } catch (error) {
      Alert.alert("No se pudo reportar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsSubmittingReport(false);
    }
  }

  function confirmBlock() {
    const name = profile?.displayName ?? profile?.username ?? "esta persona";
    Alert.alert(
      "Bloquear usuario",
      `Dejaras de ver mensajes y publicaciones de ${name}. Puedes deshacer esto desde Perfil > Bloqueos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Bloquear",
          style: "destructive",
          onPress: async () => {
            setIsMutatingBlock(true);
            try {
              await blockUser(userId);
              markBlocked(userId);
            } catch (error) {
              Alert.alert("No se pudo bloquear", error instanceof Error ? error.message : "Intentalo otra vez.");
            } finally {
              setIsMutatingBlock(false);
            }
          }
        }
      ]
    );
  }

  async function handleUnblock() {
    setIsMutatingBlock(true);
    try {
      await unblockUser(userId);
      markUnblocked(userId);
    } catch (error) {
      Alert.alert("No se pudo desbloquear", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsMutatingBlock(false);
    }
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: "Perfil" }} />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <LoadingState label="Cargando perfil" /> : null}

        {!isLoading && !profile ? (
          <EmptyState
            title="Perfil no encontrado"
            description="Puede que la cuenta haya sido eliminada o no exista en este entorno."
          />
        ) : null}

        {profile ? (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(profile.displayName ?? profile.username ?? "A").charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.displayName}>{profile.displayName ?? "Usuario local"}</Text>
            <Text style={styles.username}>{profile.username ? `@${profile.username}` : "Sin alias publico"}</Text>
            <Text style={styles.bio}>{profile.bio ?? "Sin biografia."}</Text>
          </View>
        ) : null}

        {profile && !isSelf ? (
          <>
            <SafetyNotice
              tone="default"
              title="Acciones de seguridad"
              message="Reportar comparte el contexto con moderacion sin exponer tu identidad. Bloquear oculta esta cuenta de tus chats al instante."
            />

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={isMutatingBlock}
                onPress={() => setReportOpen(true)}
                style={[styles.secondaryButton, isMutatingBlock && styles.disabled]}
              >
                <Text style={styles.secondaryText}>Reportar usuario</Text>
              </Pressable>

              {blocked ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={isMutatingBlock}
                  onPress={handleUnblock}
                  style={[styles.secondaryButton, isMutatingBlock && styles.disabled]}
                >
                  <Text style={styles.secondaryText}>{isMutatingBlock ? "Procesando..." : "Desbloquear"}</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={isMutatingBlock}
                  onPress={confirmBlock}
                  style={[styles.dangerButton, isMutatingBlock && styles.disabled]}
                >
                  <Text style={styles.dangerText}>{isMutatingBlock ? "Procesando..." : "Bloquear usuario"}</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : null}

        {isSelf ? (
          <SafetyNotice
            tone="place"
            title="Este eres tu"
            message="Para editar tu perfil usa la pestana Perfil. Las acciones de moderacion no aplican sobre tu propia cuenta."
          />
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.linkButton}>
          <Text style={styles.linkText}>Volver</Text>
        </Pressable>
      </ScrollView>

      <ReportDialog
        visible={reportOpen}
        title="Reportar usuario"
        description="Tu reporte queda asociado a esta cuenta. Elige el motivo que mejor describe el problema."
        submitting={isSubmittingReport}
        onCancel={() => (isSubmittingReport ? null : setReportOpen(false))}
        onSubmit={handleSubmitReport}
      />
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
  card: {
    alignItems: "flex-start",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 18
  },
  avatar: {
    alignItems: "center",
    backgroundColor: UI_COLORS.teal,
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    width: 60
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900"
  },
  displayName: {
    color: UI_COLORS.text,
    fontSize: 22,
    fontWeight: "900"
  },
  username: {
    color: UI_COLORS.textMuted,
    fontSize: 14
  },
  bio: {
    color: UI_COLORS.text,
    fontSize: 15,
    lineHeight: 22
  },
  actions: {
    gap: 10
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  secondaryText: {
    color: UI_COLORS.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: "#e2a89a",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  dangerText: {
    color: UI_COLORS.danger,
    fontSize: 14,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.55
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: 8
  },
  linkText: {
    color: UI_COLORS.primary,
    fontSize: 14,
    fontWeight: "800"
  }
});
