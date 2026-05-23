import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { UI_COLORS } from "../lib/constants";
import { REPORT_REASONS, type ReportReason } from "../services/moderation";

type ReportDialogProps = {
  visible: boolean;
  title?: string;
  description?: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
};

export function ReportDialog({
  visible,
  title = "Reportar contenido",
  description = "Cuentanos por que. Tu identidad no se comparte con la persona reportada.",
  submitting = false,
  onCancel,
  onSubmit
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setDetails("");
    }
  }, [visible]);

  const canSubmit = Boolean(reason) && !submitting;

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <ScrollView style={styles.options} contentContainerStyle={styles.optionsContent}>
            {REPORT_REASONS.map((option) => {
              const selected = option.value === reason;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={option.value}
                  onPress={() => setReason(option.value)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.detailsLabel}>Detalle opcional</Text>
          <TextInput
            editable={!submitting}
            multiline
            onChangeText={setDetails}
            placeholder="Comparte contexto adicional (opcional)."
            placeholderTextColor={UI_COLORS.textMuted}
            style={styles.detailsInput}
            value={details}
          />

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={submitting} onPress={onCancel} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={() => reason && onSubmit(reason, details.trim())}
              style={[styles.primaryButton, !canSubmit && styles.primaryDisabled]}
            >
              <Text style={styles.primaryText}>{submitting ? "Enviando..." : "Enviar reporte"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  sheet: {
    backgroundColor: UI_COLORS.surface,
    borderRadius: 12,
    gap: 12,
    maxHeight: "90%",
    padding: 18
  },
  title: {
    color: UI_COLORS.text,
    fontSize: 20,
    fontWeight: "900"
  },
  description: {
    color: UI_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  options: {
    maxHeight: 320
  },
  optionsContent: {
    gap: 8
  },
  option: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  optionSelected: {
    backgroundColor: "#e5efe9",
    borderColor: UI_COLORS.primary
  },
  optionLabel: {
    color: UI_COLORS.text,
    fontSize: 14,
    fontWeight: "800"
  },
  optionLabelSelected: {
    color: UI_COLORS.primaryDark
  },
  optionDescription: {
    color: UI_COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  detailsLabel: {
    color: UI_COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  detailsInput: {
    backgroundColor: UI_COLORS.surfaceMuted,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    color: UI_COLORS.text,
    minHeight: 70,
    padding: 10,
    textAlignVertical: "top"
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  secondaryText: {
    color: UI_COLORS.text,
    fontSize: 13,
    fontWeight: "800"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: UI_COLORS.primary,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  primaryDisabled: {
    opacity: 0.5
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  }
});
