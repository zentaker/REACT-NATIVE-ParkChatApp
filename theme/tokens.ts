export const colors = {
  background: "#f7f5ef",
  surface: "#fffdf8",
  surfaceMuted: "#ede8dc",
  text: "#22251f",
  textMuted: "#62675f",
  border: "#ded8c8",
  primary: "#2f6f5e",
  primaryDark: "#204d42",
  coral: "#c7654a",
  amber: "#b78a2f",
  teal: "#2f7780",
  danger: "#a64040",
  success: "#2f7a52",
  white: "#ffffff",
  overlay: "rgba(34,37,31,0.08)"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 17,
  h3: 20,
  h2: 24,
  h1: 28,
  display: 36
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium: "600" as const,
  bold: "700" as const,
  heavy: "800" as const,
  black: "900" as const
};

export const semantic = {
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  surface: colors.surface,
  muted: colors.surfaceMuted,
  danger: colors.danger,
  success: colors.success,
  warning: colors.amber,
  border: colors.border,
  text: colors.text,
  textMuted: colors.textMuted,
  background: colors.background
} as const;

const tokens = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  semantic
};

export default tokens;
