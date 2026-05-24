import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { APP_NAME, UI_COLORS } from "../../lib/constants";
import { signUpWithEmail } from "../../services/auth";

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    if (!displayName.trim()) {
      Alert.alert("Nombre requerido", "Elige un nombre visible para tu perfil.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos incompletos", "Completá todos los campos para continuar.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña muy corta", "Usa al menos 6 caracteres.");
      return;
    }
    setIsSubmitting(true);

    try {
      await signUpWithEmail({ displayName, email, password });
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "No se pudo crear la cuenta",
        error instanceof Error ? error.message : "Revisá los datos e intentá otra vez."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.kicker}>Únete a</Text>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>
            Crea una cuenta para participar en chats, grupos y eventos locales.
          </Text>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              Tu ubicación exacta no se comparte públicamente. Tu perfil solo muestra tu nombre.
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre visible</Text>
            <TextInput
              onChangeText={setDisplayName}
              placeholder="Cómo te conocerán en los lugares"
              placeholderTextColor={UI_COLORS.textMuted}
              style={styles.input}
              value={displayName}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={UI_COLORS.textMuted}
              style={styles.input}
              value={email}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={UI_COLORS.textMuted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleSignUp}
            style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.pressed]}
          >
            <Text style={styles.primaryText}>{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</Text>
          </Pressable>
        </View>

        <Link href="/sign-in" style={styles.link}>
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: UI_COLORS.background,
    flex: 1
  },
  scroll: {
    flexGrow: 1,
    gap: 24,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 40
  },
  hero: {
    gap: 10
  },
  kicker: {
    color: UI_COLORS.teal,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  subtitle: {
    color: UI_COLORS.textMuted,
    fontSize: 16,
    lineHeight: 23
  },
  privacyRow: {
    alignItems: "flex-start",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    padding: 14
  },
  privacyIcon: {
    fontSize: 16,
    marginTop: 1
  },
  privacyText: {
    color: UI_COLORS.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19
  },
  form: {
    gap: 14
  },
  fieldGroup: {
    gap: 6
  },
  label: {
    color: UI_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    paddingLeft: 2
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
    marginTop: 4,
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
  link: {
    color: UI_COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  }
});
