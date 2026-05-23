import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { UI_COLORS } from "../lib/constants";
import { DateTimeField } from "./DateTimeField";

export type EventFormValues = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
};

type Props = {
  initialValues?: Partial<EventFormValues>;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
};

function normalizeIso(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function EventForm({ initialValues, submitLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [startsAt, setStartsAt] = useState(normalizeIso(initialValues?.startsAt));
  const [endsAt, setEndsAt] = useState(normalizeIso(initialValues?.endsAt));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePress() {
    if (!title.trim()) {
      Alert.alert("Falta titulo", "El evento necesita un titulo claro.");
      return;
    }
    if (!startsAt) {
      Alert.alert("Falta fecha", "Selecciona la fecha y hora de inicio.");
      return;
    }
    if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      Alert.alert("Revisa el fin", "La fecha de fin debe ser posterior al inicio.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ title, description, startsAt, endsAt });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Titulo</Text>
        <TextInput
          maxLength={120}
          onChangeText={setTitle}
          placeholder="Ej. Picnic abierto al parque"
          placeholderTextColor={UI_COLORS.textMuted}
          style={styles.input}
          value={title}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Descripcion (opcional)</Text>
        <TextInput
          maxLength={500}
          multiline
          numberOfLines={4}
          onChangeText={setDescription}
          placeholder="Programa, punto de encuentro general, reglas y como llegar."
          placeholderTextColor={UI_COLORS.textMuted}
          style={[styles.input, styles.textArea]}
          value={description}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Inicio</Text>
        <DateTimeField
          value={startsAt}
          onChange={setStartsAt}
          placeholder="Elegir fecha y hora"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Fin (opcional)</Text>
        <DateTimeField
          value={endsAt}
          onChange={setEndsAt}
          placeholder="Elegir fecha y hora"
          minimumDate={startsAt ? new Date(startsAt) : undefined}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={handlePress}
        style={({ pressed }) => [styles.primaryButton, (pressed || isSubmitting) && styles.pressed]}
      >
        <Text style={styles.primaryText}>{isSubmitting ? "Guardando..." : submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
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
