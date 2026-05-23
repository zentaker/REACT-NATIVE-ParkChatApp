import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

export type DateTimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
};

function parseValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatHuman(value: string): string {
  const date = parseValue(value);
  if (!date) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function DateTimeField({ value, onChange, placeholder, minimumDate }: DateTimeFieldProps) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const current = parseValue(value) ?? new Date();
  const display = formatHuman(value);

  function handleAndroidDate(event: DateTimePickerEvent, selected?: Date) {
    setShowDate(false);
    if (event.type === "dismissed" || !selected) return;
    setPendingDate(selected);
    setShowTime(true);
  }

  function handleAndroidTime(event: DateTimePickerEvent, selected?: Date) {
    setShowTime(false);
    if (event.type === "dismissed" || !selected) return;
    const base = pendingDate ?? current;
    const next = new Date(base);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setPendingDate(null);
    onChange(next.toISOString());
  }

  function handleIosChange(_event: DateTimePickerEvent, selected?: Date) {
    if (!selected) return;
    onChange(selected.toISOString());
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (Platform.OS === "ios") {
            setShowDate((prev) => !prev);
          } else {
            setShowDate(true);
          }
        }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={[styles.text, !display && styles.placeholder]}>
          {display || placeholder || "Seleccionar fecha y hora"}
        </Text>
      </Pressable>

      {Platform.OS === "ios" && showDate ? (
        <DateTimePicker
          value={current}
          mode="datetime"
          display="spinner"
          minimumDate={minimumDate}
          onChange={handleIosChange}
          style={styles.iosPicker}
        />
      ) : null}

      {Platform.OS !== "ios" && showDate ? (
        <DateTimePicker value={current} mode="date" minimumDate={minimumDate} onChange={handleAndroidDate} />
      ) : null}

      {Platform.OS !== "ios" && showTime ? (
        <DateTimePicker value={pendingDate ?? current} mode="time" onChange={handleAndroidTime} />
      ) : null}

      {value ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange("")}
          style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
        >
          <Text style={styles.clearText}>Limpiar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  button: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  text: { color: UI_COLORS.text, fontSize: 15 },
  placeholder: { color: UI_COLORS.textMuted },
  pressed: { opacity: 0.78 },
  iosPicker: { alignSelf: "stretch" },
  clearButton: { alignSelf: "flex-start", paddingHorizontal: 4, paddingVertical: 4 },
  clearText: { color: UI_COLORS.textMuted, fontSize: 13, fontWeight: "700" }
});
