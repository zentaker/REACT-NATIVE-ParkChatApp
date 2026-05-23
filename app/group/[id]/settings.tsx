import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccessLevelPicker } from "../../../components/AccessLevelPicker";
import { EmptyState } from "../../../components/EmptyState";
import { LoadingState } from "../../../components/LoadingState";
import { SafetyNotice } from "../../../components/SafetyNotice";
import { UI_COLORS } from "../../../lib/constants";
import { deleteGroup, getGroupById, updateGroup } from "../../../services/groups";
import { getCurrentUserId } from "../../../services/auth";
import type { AccessLevel, LocalGroup } from "../../../types";

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id ?? "");
  const [group, setGroup] = useState<LocalGroup | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("public");
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getGroupById(groupId), getCurrentUserId().catch(() => null)])
      .then(([nextGroup, userId]) => {
        if (!isMounted) return;
        setGroup(nextGroup);
        if (nextGroup) {
          setName(nextGroup.name);
          setDescription(nextGroup.description ?? "");
          setAccessLevel(nextGroup.accessLevel);
          setIsOwner(Boolean(userId && nextGroup.createdBy === userId));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const updated = await updateGroup(groupId, { name, description, accessLevel });
      setGroup(updated);
      Alert.alert("Cambios guardados", "Los datos del grupo se actualizaron.");
    } catch (error) {
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteGroup(groupId);
      router.back();
    } catch (error) {
      Alert.alert("No se pudo eliminar", error instanceof Error ? error.message : "Intentalo otra vez.");
    } finally {
      setIsDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Eliminar grupo", "Esta accion no se puede deshacer. Continuar?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: handleDelete }
    ]);
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes del grupo</Text>
          <Text style={styles.subtitle}>Edita los datos basicos o da de baja al grupo.</Text>
        </View>

        {isLoading ? <LoadingState label="Cargando grupo" /> : null}

        {!isLoading && !group ? (
          <EmptyState title="Grupo no encontrado" description="No existe en mocks ni en Supabase." />
        ) : null}

        {group && !isOwner ? (
          <SafetyNotice message="Solo el creador del grupo puede editar o eliminarlo." />
        ) : null}

        {group ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                editable={isOwner}
                maxLength={80}
                onChangeText={setName}
                placeholder="Nombre del grupo"
                placeholderTextColor={UI_COLORS.textMuted}
                style={styles.input}
                value={name}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descripcion</Text>
              <TextInput
                editable={isOwner}
                maxLength={400}
                multiline
                numberOfLines={4}
                onChangeText={setDescription}
                placeholder="Que hace este grupo"
                placeholderTextColor={UI_COLORS.textMuted}
                style={[styles.input, styles.textArea]}
                value={description}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Acceso</Text>
              <AccessLevelPicker onChange={isOwner ? setAccessLevel : () => undefined} value={accessLevel} />
            </View>

            {isOwner ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={handleSave}
                  style={({ pressed }) => [styles.primaryButton, (pressed || isSaving) && styles.pressed]}
                >
                  <Text style={styles.primaryText}>{isSaving ? "Guardando..." : "Guardar cambios"}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isDeleting}
                  onPress={confirmDelete}
                  style={({ pressed }) => [styles.dangerButton, (pressed || isDeleting) && styles.pressed]}
                >
                  <Text style={styles.dangerText}>{isDeleting ? "Eliminando..." : "Eliminar grupo"}</Text>
                </Pressable>
              </>
            ) : null}
          </>
        ) : null}
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
  dangerButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.danger,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  dangerText: { color: UI_COLORS.danger, fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.78 }
});
