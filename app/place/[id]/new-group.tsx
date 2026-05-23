import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccessLevelPicker } from "../../../components/AccessLevelPicker";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { createGroup } from "../../../services/groups";
import type { AccessLevel } from "../../../types";

export default function NewGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = String(id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Falta nombre", "El grupo necesita un nombre breve y claro.");
      return;
    }
    setIsSubmitting(true);
    try {
      const group = await createGroup({
        placeId,
        name,
        description,
        accessLevel
      });
      router.replace({ pathname: "/group/[id]", params: { id: group.id } });
    } catch (error) {
      Alert.alert("No se pudo crear", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear grupo</Text>
          <Text style={styles.subtitle}>Define una comunidad hiperlocal asociada a este lugar.</Text>
        </View>

        <SafetyNotice message="Elige un acceso acorde al cuidado necesario: publico, local o por aprobacion." />

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            maxLength={80}
            onChangeText={setName}
            placeholder="Ej. Lectura al aire libre"
            placeholderTextColor={UI_COLORS.textMuted}
            style={styles.input}
            value={name}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descripcion (opcional)</Text>
          <TextInput
            maxLength={400}
            multiline
            numberOfLines={4}
            onChangeText={setDescription}
            placeholder="Que hacen, cuando se juntan, como participar."
            placeholderTextColor={UI_COLORS.textMuted}
            style={[styles.input, styles.textArea]}
            value={description}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Acceso</Text>
          <AccessLevelPicker onChange={setAccessLevel} value={accessLevel} />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.pressed]}
        >
          <Text style={styles.primaryText}>{isSubmitting ? "Creando..." : "Crear grupo"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: UI_COLORS.background, flex: 1 },
  content: { gap: 18, padding: 18, paddingBottom: 32 },
  header: { gap: 8 },
  title: { color: UI_COLORS.text, fontSize: 26, fontWeight: "900" },
  subtitle: { color: UI_COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  field: { gap: 8 },
  label: { color: UI_COLORS.text, fontSize: 14, fontWeight: "800" },
  input: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: UI_COLORS.text,
    fontSize: 15,
    padding: 12
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  primaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16
  },
  primaryText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
  pressed: { opacity: 0.78 }
});
