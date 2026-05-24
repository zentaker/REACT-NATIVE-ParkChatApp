import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { SafetyNotice } from "../../components/SafetyNotice";
import { useAuth } from "../../hooks/useAuth";
import { UI_COLORS } from "../../lib/constants";
import { signOut } from "../../services/auth";
import { getUserTopicInterests, upsertUserTopicInterest } from "../../services/graph";
import { isCurrentUserModerator } from "../../services/moderation";
import { getCurrentProfile } from "../../services/profile";
import type { UserTopicInterest } from "../../types/graph";
import type { Profile } from "../../types";

const SAFETY_MODE_LABELS: Record<string, string> = {
  normal: "Normal",
  strict: "Estricto",
  anonymous: "Anónimo"
};

export default function ProfileScreen() {
  const { isMockMode } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [interests, setInterests] = useState<UserTopicInterest[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [isAddingInterest, setIsAddingInterest] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentProfile()
      .then((nextProfile) => {
        if (isMounted) setProfile(nextProfile);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    isCurrentUserModerator()
      .then((flag) => {
        if (isMounted) setIsModerator(flag);
      })
      .catch(() => {
        if (isMounted) setIsModerator(false);
      });

    getUserTopicInterests()
      .then((data) => {
        if (isMounted) setInterests(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      if (isMockMode) {
        Alert.alert("Modo demo", "La sesión de demo permanece disponible para seguir explorando.");
      } else {
        router.replace("/sign-in");
      }
    } catch (error) {
      Alert.alert("No se pudo cerrar sesión", error instanceof Error ? error.message : "Intentá otra vez.");
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleAddInterest() {
    const trimmed = newInterest.trim().replace(/^#/, "");
    if (!trimmed) return;

    setIsAddingInterest(true);
    try {
      const result = await upsertUserTopicInterest(trimmed, "manual");
      if (result) {
        setInterests((prev) => {
          const exists = prev.find((i) => i.topicTagId === result.topicTagId);
          if (exists) return prev.map((i) => (i.topicTagId === result.topicTagId ? result : i));
          return [result, ...prev];
        });
        setNewInterest("");
      }
    } catch {
    } finally {
      setIsAddingInterest(false);
    }
  }

  const initials = (profile?.displayName ?? profile?.username ?? "A").charAt(0).toUpperCase();
  const safetyLabel = SAFETY_MODE_LABELS[profile?.safetyMode ?? "normal"] ?? profile?.safetyMode ?? "normal";

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Mi perfil</Text>
        </View>

        {isLoading ? <LoadingState label="Cargando perfil" /> : null}

        {!isLoading && !profile ? (
          <EmptyState
            icon="👤"
            title="Sin perfil cargado"
            description="Inicia sesión con tu cuenta para ver y gestionar tu perfil."
          />
        ) : null}

        {profile ? (
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.displayName}>{profile.displayName ?? "Tu nombre"}</Text>
                <Text style={styles.username}>{profile.username ? `@${profile.username}` : ""}</Text>
              </View>
            </View>
            {profile.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : (
              <Text style={styles.bioEmpty}>Agrega una bio para que la comunidad te conozca mejor.</Text>
            )}
            <View style={styles.safetyRow}>
              <Text style={styles.safetyLabel}>🛡️ Modo de seguridad</Text>
              <View style={styles.safetyPill}>
                <Text style={styles.safetyValue}>{safetyLabel}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis intereses</Text>
            <Text style={styles.sectionHint}>Influyen en el grafo social del lugar</Text>
          </View>
          {interests.length === 0 ? (
            <Text style={styles.emptyHint}>
              Aún no tienes intereses. Usa hashtags en el chat o agréga uno aquí.
            </Text>
          ) : (
            <View style={styles.tagList}>
              {interests.map((interest) => (
                <View key={interest.id} style={styles.tagChip}>
                  <Text style={styles.tagName}>#{interest.topicTag?.name ?? interest.topicTagId.slice(0, 8)}</Text>
                  {interest.weight > 1 ? (
                    <View style={styles.tagWeightBadge}>
                      <Text style={styles.tagWeight}>{interest.weight}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
          <View style={styles.addInterestRow}>
            <TextInput
              editable={!isAddingInterest}
              onChangeText={setNewInterest}
              onSubmitEditing={handleAddInterest}
              placeholder="#musica, #tenis..."
              placeholderTextColor={UI_COLORS.textMuted}
              returnKeyType="done"
              style={styles.interestInput}
              value={newInterest}
            />
            <Pressable
              accessibilityRole="button"
              disabled={isAddingInterest || !newInterest.trim()}
              onPress={handleAddInterest}
              style={({ pressed }) => [styles.addButton, (pressed || isAddingInterest) && styles.addButtonPressed]}
            >
              <Text style={styles.addButtonText}>{isAddingInterest ? "..." : "Agregar"}</Text>
            </Pressable>
          </View>
        </View>

        <SafetyNotice message="Tu ubicación exacta nunca se comparte. Solo participas con tu nombre en espacios públicos." />

        <View style={styles.actionsGrid}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/my-groups" as never)}
            style={styles.actionTile}
          >
            <Text style={styles.actionTileIcon}>👥</Text>
            <Text style={styles.actionTileLabel}>Mis grupos</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/my-events" as never)}
            style={styles.actionTile}
          >
            <Text style={styles.actionTileIcon}>📅</Text>
            <Text style={styles.actionTileLabel}>Mis eventos</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/blocks")}
            style={styles.actionTile}
          >
            <Text style={styles.actionTileIcon}>🚫</Text>
            <Text style={styles.actionTileLabel}>Bloqueos</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.actionTile}
          >
            <Text style={styles.actionTileIcon}>✏️</Text>
            <Text style={styles.actionTileLabel}>Editar perfil</Text>
          </Pressable>
        </View>

        {isModerator ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/moderation/inbox" as Parameters<typeof router.push>[0])}
            style={styles.moderatorButton}
          >
            <Text style={styles.moderatorIcon}>🔍</Text>
            <Text style={styles.moderatorText}>Bandeja de moderación</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={[styles.signOutButton, isSigningOut && styles.disabledButton]}
        >
          <Text style={styles.signOutText}>{isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}</Text>
        </Pressable>
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
    gap: 16,
    padding: 18,
    paddingBottom: 40
  },
  header: {
    gap: 4
  },
  screenTitle: {
    color: UI_COLORS.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  profileCard: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
    padding: 18
  },
  profileTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  avatar: {
    alignItems: "center",
    backgroundColor: UI_COLORS.teal,
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900"
  },
  profileInfo: {
    flex: 1,
    gap: 4
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
  bioEmpty: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20
  },
  safetyRow: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surfaceMuted,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12
  },
  safetyLabel: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  safetyPill: {
    backgroundColor: UI_COLORS.primary + "22",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  safetyValue: {
    color: UI_COLORS.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  section: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  sectionHeader: {
    gap: 2
  },
  sectionTitle: {
    color: UI_COLORS.text,
    fontSize: 17,
    fontWeight: "900"
  },
  sectionHint: {
    color: UI_COLORS.textMuted,
    fontSize: 12
  },
  emptyHint: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tagChip: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surfaceMuted,
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  tagName: {
    color: UI_COLORS.primary,
    fontSize: 13,
    fontWeight: "800"
  },
  tagWeightBadge: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1
  },
  tagWeight: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center"
  },
  addInterestRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  interestInput: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: UI_COLORS.text,
    flex: 1,
    fontSize: 14,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  addButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16
  },
  addButtonPressed: {
    opacity: 0.7
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800"
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  actionTile: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexBasis: "45%",
    gap: 6,
    minHeight: 72,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 16
  },
  actionTileIcon: {
    fontSize: 22
  },
  actionTileLabel: {
    color: UI_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  moderatorButton: {
    alignItems: "center",
    backgroundColor: "#fff8ec",
    borderColor: "#e6c98a",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  moderatorIcon: {
    fontSize: 16
  },
  moderatorText: {
    color: UI_COLORS.amber,
    fontSize: 14,
    fontWeight: "800"
  },
  signOutButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: "#e2c8b7",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  signOutText: {
    color: UI_COLORS.coral,
    fontSize: 15,
    fontWeight: "800"
  },
  disabledButton: {
    opacity: 0.6
  }
});
