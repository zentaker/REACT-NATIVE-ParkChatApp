import { supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type { CreateFeedbackInput, PilotFeedback } from "../types/feedback";

type FeedbackRow = {
  id: string;
  user_id: string | null;
  place_id: string | null;
  rating: number | null;
  category: string | null;
  message: string | null;
  created_at: string;
};

function mapRow(row: FeedbackRow): PilotFeedback {
  return {
    id: row.id,
    userId: row.user_id,
    placeId: row.place_id,
    rating: row.rating,
    category: row.category as PilotFeedback["category"],
    message: row.message,
    createdAt: row.created_at
  };
}

export async function submitFeedback(input: CreateFeedbackInput): Promise<PilotFeedback | null> {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) throw new Error("Debes iniciar sesión para enviar feedback.");
  if (!supabase) throw new Error("Supabase no está configurado.");

  const { data, error } = await supabase
    .from("pilot_feedback")
    .insert({
      user_id: userId,
      place_id: input.placeId ?? null,
      rating: input.rating,
      category: input.category,
      message: input.message?.trim() || null
    })
    .select("id, user_id, place_id, rating, category, message, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function getMyFeedback(): Promise<PilotFeedback[]> {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId || !supabase) return [];

  const { data, error } = await supabase
    .from("pilot_feedback")
    .select("id, user_id, place_id, rating, category, message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []).map(mapRow);
}
