import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { APP_NAME, UI_COLORS } from "../../lib/constants";
import { isSupabaseConfigured } from "../../lib/supabase";
import { signInWithEmail } from "../../services/auth";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    setIsSubmitting(true);

    try {
      await signInWithEmail({ email, password });
      router.replace("/");
    } catch (error) {
      Alert.alert("No se pudo iniciar sesion", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Bienvenido a</Text>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Entra a los espacios digitales de lugares reales.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={UI_COLORS.textMuted}
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={UI_COLORS.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleSignIn}
            style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.pressed]}
          >
            <Text style={styles.primaryText}>{isSubmitting ? "Entrando..." : "Entrar"}</Text>
          </Pressable>
        </View>

        {!isSupabaseConfigured && (
          <Text style={styles.helper}>Sin credenciales de Supabase, Aldea usa datos mock para desarrollo.</Text>
        )}

        <Link href="/sign-up" style={styles.link}>
          Crear cuenta
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: UI_COLORS.background,
    flex: 1
  },
  container: {
    flex: 1,
    gap: 24,
    justifyContent: "center",
    padding: 24
  },
  header: {
    gap: 8
  },
  kicker: {
    color: UI_COLORS.coral,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 16,
    lineHeight: 23
  },
  form: {
    gap: 12
  },
  input: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: UI_COLORS.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.78
  },
  helper: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  link: {
    color: UI_COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  }
});
