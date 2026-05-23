import { Pressable, StyleSheet, Text, View } from "react-native";

import { ACCESS_LEVEL_LABELS, UI_COLORS } from "../lib/constants";
import type { AccessLevel } from "../types";

const OPTIONS: AccessLevel[] = ["public", "local_only", "approval_required", "invite_only", "private"];

type Props = {
  value: AccessLevel;
  onChange: (next: AccessLevel) => void;
};

export function AccessLevelPicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const isActive = option === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => onChange(option)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {ACCESS_LEVEL_LABELS[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    backgroundColor: UI_COLORS.surface,
    borderColor: UI_COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  chipActive: {
    backgroundColor: UI_COLORS.primary,
    borderColor: UI_COLORS.primary
  },
  chipText: {
    color: UI_COLORS.text,
    fontSize: 13,
    fontWeight: "700"
  },
  chipTextActive: {
    color: "#ffffff"
  }
});
