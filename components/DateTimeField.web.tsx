import { StyleSheet, View } from "react-native";

import { UI_COLORS } from "../lib/constants";

export type DateTimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
};

function toLocalInput(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function toMinAttr(date?: Date): string | undefined {
  if (!date) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function DateTimeField({ value, onChange, placeholder, minimumDate }: DateTimeFieldProps) {
  return (
    <View style={styles.container}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <input
        type="datetime-local"
        value={toLocalInput(value)}
        min={toMinAttr(minimumDate)}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) {
            onChange("");
            return;
          }
          const date = new Date(next);
          if (Number.isNaN(date.getTime())) return;
          onChange(date.toISOString());
        }}
        style={webInputStyle}
      />
    </View>
  );
}

const webInputStyle: Record<string, string | number> = {
  backgroundColor: UI_COLORS.surface,
  borderColor: UI_COLORS.border,
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: "solid",
  color: UI_COLORS.text,
  fontSize: 15,
  padding: 12,
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  outline: "none"
};

const styles = StyleSheet.create({
  container: { gap: 8 }
});
