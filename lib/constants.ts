export const APP_NAME = "Aldea";

export const MOCK_USER_ID = "00000000-0000-4000-8000-000000000001";

export const PLACE_IDS = {
  parqueKennedy: "11111111-1111-4111-8111-111111111111",
  barrancoPlaza: "22222222-2222-4222-8222-222222222222",
  cafeCultural: "33333333-3333-4333-8333-333333333333",
  coworkingCreativo: "44444444-4444-4444-8444-444444444444"
} as const;

export const UI_COLORS = {
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
  success: "#2f7a52"
} as const;

export const ACCESS_LEVEL_LABELS = {
  public: "Público",
  local_only: "Solo local",
  invite_only: "Solo invitación",
  approval_required: "Requiere aprobación",
  verified_only: "Verificado",
  private: "Privado"
} as const;

export const PLACE_TYPE_LABELS = {
  park: "Parque",
  plaza: "Plaza",
  cafe: "Cafe",
  campus: "Campus",
  coworking: "Coworking",
  neighborhood: "Barrio",
  beach: "Playa",
  market: "Mercado",
  cultural_space: "Espacio cultural",
  other: "Lugar"
} as const;
