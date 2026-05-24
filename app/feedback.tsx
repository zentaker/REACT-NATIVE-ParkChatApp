import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { UI_COLORS } from "../lib/constants";
import { submitFeedback } from "../services/feedback";
import { trackFeedbackSubmitted } from "../services/analytics";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory
} from "../types/feedback";

const STAR_LABELS = ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

export default function FeedbackScreen() {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert("Falta la puntuación", "Por favor elige cuántas estrellas merece tu experiencia.");
      return;
    }
    if (!category) {
      Alert.alert("Falta la categoría", "Elige la categoría que mejor describe tu feedback.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({ rating, category, message: message.trim() || undefined });
      trackFeedbackSubmitted();
      setSubmitted(true);
    } catch (err) {
      Alert.alert(
        "No se pudo enviar",
        err instanceof Error ? err.message : "Intentalo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🙌</Text>
          <Text style={styles.successTitle}>¡Gracias por tu feedback!</Text>
          <Text style={styles.successBody}>
            Tus comentarios nos ayudan a mejorar Aldea para toda la comunidad.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Cerrar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Text style={styles.backBtnText}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Dar feedback</Text>
          <Text style={styles.subtitle}>
            Cuéntanos cómo está siendo tu experiencia en Aldea.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>¿Cómo calificarías tu experiencia?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                accessibilityRole="button"
                accessibilityLabel={STAR_LABELS[star - 1]}
                onPress={() => setRating(star)}
                style={({ pressed }) => [styles.starBtn, pressed && styles.pressed]}
              >
                <Text style={[styles.starIcon, star <= rating && styles.starActive]}>
                  {star <= rating ? "★" : "☆"}
                </Text>
              </Pressable>
            ))}
          </View>
          {rating > 0 ? (
            <Text style={styles.ratingLabel}>{STAR_LABELS[rating - 1]}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chips}>
            {FEEDBACK_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                accessibilityRole="button"
                onPress={() => setCategory(cat)}
                style={({ pressed }) => [
                  styles.chip,
                  category === cat && styles.chipActive,
                  pressed && styles.pressed
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === cat && styles.chipTextActive
                  ]}
                >
                  {FEEDBACK_CATEGORY_LABELS[cat]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Comentario (opcional)</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Escribe aquí tus comentarios o sugerencias..."
            placeholderTextColor={UI_COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{message.length}/500</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitBtn,
            (isSubmitting || rating === 0 || !category) && styles.submitBtnDisabled,
            pressed && !isSubmitting && styles.pressed
          ]}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? "Enviando…" : "Enviar feedback"}
          </Text>
        </Pressable>

        <Text style={styles.privacy}>
          Tu feedback es confidencial y no se asocia públicamente a tu perfil.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: UI_COLORS.background
  },
  content: {
    padding: 20,
    paddingBottom: 48
  },
  header: {
    marginBottom: 28
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 16
  },
  backBtnText: {
    fontSize: 15,
    color: UI_COLORS.primary,
    fontWeight: "500"
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: UI_COLORS.text,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 15,
    color: UI_COLORS.textMuted,
    lineHeight: 22
  },
  section: {
    marginBottom: 28
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: UI_COLORS.text,
    marginBottom: 12
  },
  stars: {
    flexDirection: "row",
    gap: 8
  },
  starBtn: {
    padding: 4
  },
  starIcon: {
    fontSize: 36,
    color: UI_COLORS.textMuted
  },
  starActive: {
    color: UI_COLORS.amber
  },
  ratingLabel: {
    marginTop: 8,
    fontSize: 13,
    color: UI_COLORS.textMuted,
    fontStyle: "italic"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    backgroundColor: UI_COLORS.surface
  },
  chipActive: {
    backgroundColor: UI_COLORS.primary,
    borderColor: UI_COLORS.primary
  },
  chipText: {
    fontSize: 13,
    color: UI_COLORS.textMuted,
    fontWeight: "500"
  },
  chipTextActive: {
    color: "#fff"
  },
  input: {
    backgroundColor: UI_COLORS.surface,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: UI_COLORS.text,
    minHeight: 100
  },
  charCount: {
    marginTop: 6,
    fontSize: 12,
    color: UI_COLORS.textMuted,
    textAlign: "right"
  },
  submitBtn: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16
  },
  submitBtnDisabled: {
    opacity: 0.5
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff"
  },
  privacy: {
    fontSize: 12,
    color: UI_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: UI_COLORS.text,
    marginBottom: 12,
    textAlign: "center"
  },
  successBody: {
    fontSize: 15,
    color: UI_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32
  },
  doneBtn: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff"
  },
  pressed: {
    opacity: 0.7
  }
});
