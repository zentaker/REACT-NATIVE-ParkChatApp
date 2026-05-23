import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { SafetyNotice } from "../../components/SafetyNotice";
import { useAuth } from "../../hooks/useAuth";
import { UI_COLORS } from "../../lib/constants";
import { signOut } from "../../services/auth";
import { getCurrentProfile } from "../../services/profile";
import type { Profile } from "../../types";

export default function ProfileScreen() {
  const { isMockMode } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentProfile()
      .then((nextProfile) => {
        if (isMounted) setProfile(nextProfile);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      if (isMockMode) {
        Alert.alert("Modo mock", "Sin Supabase configurado, la sesion mock permanece disponible para desarrollo.");
      } else {
        router.replace("/sign-in");
      }
    } catch (error) {
      Alert.alert("No se pudo cerrar sesion", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>Identidad basica, seguridad y preparacion para bloqueos/reportes.</Text>
        </View>

        {isLoading ? <LoadingState label="Cargando perfil" /> : null}

        {!isLoading && !profile ? <EmptyState title="Sin perfil" description="Conecta Supabase Auth para cargar el perfil real." /> : null}

        {profile ? (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(profile.displayName ?? profile.username ?? "A").charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.displayName}>{profile.displayName ?? "Usuario local"}</Text>
            <Text style={styles.username}>{profile.username ? `@${profile.username}` : "Perfil mock"}</Text>
            <Text style={styles.bio}>{profile.bio ?? "Agrega una bio para explicar como participas en comunidades locales."}</Text>
            <View style={styles.safetyRow}>
              <Text style={styles.safetyLabel}>Safety mode</Text>
              <Text style={styles.safetyValue}>{profile.safetyMode}</Text>
            </View>
          </View>
        ) : null}

        <SafetyNotice message="Puedes preparar bloqueos y reportes sin exponer tu ubicacion exacta en la interfaz." />

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Editar perfil</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Bloqueos y reportes</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={[styles.secondaryButton, styles.signOutButton, isSigningOut && styles.disabledButton]}
          >
            <Text style={styles.signOutText}>{isSigningOut ? "Cerrando..." : "Cerrar sesion"}</Text>
          </Pressable>
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
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  profileCard: {
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
  safetyRow: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surfaceMuted,
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 12,
    width: "100%"
  },
  safetyLabel: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  safetyValue: {
    color: UI_COLORS.primary,
    fontSize: 13,
    fontWeight: "900"
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
  signOutButton: {
    borderColor: "#e2c8b7"
  },
  signOutText: {
    color: UI_COLORS.coral,
    fontSize: 14,
    fontWeight: "800"
  },
  disabledButton: {
    opacity: 0.6
  }
});
