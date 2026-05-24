import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getCurrentUserId } from "./auth";
import type {
  MessageTopicTag,
  PlaceTopic,
  TopicTag,
  UserConnection,
  UserPlace,
  UserPlaceRelationshipType,
  UserTopicInterest
} from "../types/graph";

type UserPlaceRow = {
  id: string;
  user_id: string;
  place_id: string;
  relationship_type: string;
  last_seen_at: string;
  visit_count: number;
  created_at: string;
};

type TopicTagRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

type PlaceTopicRow = {
  id: string;
  place_id: string;
  topic_tag_id: string;
  weight: number;
  last_activity_at: string;
  created_at: string;
  topic_tags?: TopicTagRow | TopicTagRow[] | null;
};

type UserTopicInterestRow = {
  id: string;
  user_id: string;
  topic_tag_id: string;
  source: string;
  weight: number;
  created_at: string;
  topic_tags?: TopicTagRow | TopicTagRow[] | null;
};

type UserConnectionRow = {
  id: string;
  user_a: string;
  user_b: string;
  source: string;
  place_id: string | null;
  event_id: string | null;
  group_id: string | null;
  weight: number;
  created_at: string;
};

function mapUserPlace(row: UserPlaceRow): UserPlace {
  return {
    id: row.id,
    userId: row.user_id,
    placeId: row.place_id,
    relationshipType: row.relationship_type as UserPlaceRelationshipType,
    lastSeenAt: row.last_seen_at,
    visitCount: row.visit_count,
    createdAt: row.created_at
  };
}

function mapTopicTag(row: TopicTagRow): TopicTag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at
  };
}

function mapPlaceTopic(row: PlaceTopicRow): PlaceTopic {
  const tagRow = Array.isArray(row.topic_tags) ? row.topic_tags[0] : row.topic_tags;
  return {
    id: row.id,
    placeId: row.place_id,
    topicTagId: row.topic_tag_id,
    weight: row.weight,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    topicTag: tagRow ? mapTopicTag(tagRow) : undefined
  };
}

function mapUserTopicInterest(row: UserTopicInterestRow): UserTopicInterest {
  const tagRow = Array.isArray(row.topic_tags) ? row.topic_tags[0] : row.topic_tags;
  return {
    id: row.id,
    userId: row.user_id,
    topicTagId: row.topic_tag_id,
    source: row.source as UserTopicInterest["source"],
    weight: row.weight,
    createdAt: row.created_at,
    topicTag: tagRow ? mapTopicTag(tagRow) : undefined
  };
}

function mapUserConnection(row: UserConnectionRow): UserConnection {
  return {
    id: row.id,
    userA: row.user_a,
    userB: row.user_b,
    source: row.source as UserConnection["source"],
    placeId: row.place_id,
    eventId: row.event_id,
    groupId: row.group_id,
    weight: row.weight,
    createdAt: row.created_at
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u00e0-\u00fc]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#([a-zA-Z\u00c0-\u017e][a-zA-Z0-9\u00c0-\u017e_-]*)/g);
  if (!matches) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const tag = m.slice(1).toLowerCase();
    if (!seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }
  return result;
}

export async function upsertUserPlace(
  placeId: string,
  relationshipType: UserPlaceRelationshipType = "visited"
): Promise<UserPlace | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data: existing, error: selectError } = await supabase
    .from("user_places")
    .select("*")
    .eq("user_id", userId)
    .eq("place_id", placeId)
    .maybeSingle();

  if (selectError) {
    console.warn("[graph] upsertUserPlace select error:", selectError.message);
    return null;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("user_places")
      .update({
        relationship_type: relationshipType,
        last_seen_at: new Date().toISOString(),
        visit_count: (existing as UserPlaceRow).visit_count + 1
      })
      .eq("id", (existing as UserPlaceRow).id)
      .select()
      .single();

    if (error) {
      console.warn("[graph] upsertUserPlace update error:", error.message);
      return null;
    }
    return mapUserPlace(data as UserPlaceRow);
  }

  const { data, error } = await supabase
    .from("user_places")
    .insert({
      user_id: userId,
      place_id: placeId,
      relationship_type: relationshipType,
      last_seen_at: new Date().toISOString(),
      visit_count: 1
    })
    .select()
    .single();

  if (error) {
    console.warn("[graph] upsertUserPlace insert error:", error.message);
    return null;
  }
  return mapUserPlace(data as UserPlaceRow);
}

export async function getUserPlaces(): Promise<UserPlace[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_places")
    .select("*")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false });

  if (error) {
    console.warn("[graph] getUserPlaces error:", error.message);
    return [];
  }
  return (data as UserPlaceRow[]).map(mapUserPlace);
}

export async function getPlaceTopics(placeId: string, limit = 10): Promise<PlaceTopic[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("place_topics")
    .select("*, topic_tags(*)")
    .eq("place_id", placeId)
    .order("weight", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[graph] getPlaceTopics error:", error.message);
    return [];
  }
  return (data as PlaceTopicRow[]).map(mapPlaceTopic);
}

export async function getTopicTags(): Promise<TopicTag[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("topic_tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.warn("[graph] getTopicTags error:", error.message);
    return [];
  }
  return (data as TopicTagRow[]).map(mapTopicTag);
}

export async function tagMessage(
  messageId: string,
  placeId: string,
  topicNames: string[]
): Promise<MessageTopicTag[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  if (!topicNames.length) return [];

  const results: MessageTopicTag[] = [];

  for (const name of topicNames) {
    const slug = slugify(name);
    if (!slug) continue;

    let tagId: string;

    const { data: existingTag } = await supabase
      .from("topic_tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingTag) {
      tagId = (existingTag as { id: string }).id;
    } else {
      const { data: newTag, error: tagError } = await supabase
        .from("topic_tags")
        .insert({ name, slug })
        .select("id")
        .single();

      if (tagError || !newTag) {
        console.warn("[graph] tagMessage: could not create tag", name, tagError?.message);
        continue;
      }
      tagId = (newTag as { id: string }).id;
    }

    const { data: mtt, error: mttError } = await supabase
      .from("message_topic_tags")
      .insert({ message_id: messageId, topic_tag_id: tagId })
      .select()
      .single();

    if (mttError) {
      console.warn("[graph] tagMessage: could not link tag to message:", mttError.message);
    } else if (mtt) {
      const row = mtt as { id: string; message_id: string; topic_tag_id: string; created_at: string };
      results.push({
        id: row.id,
        messageId: row.message_id,
        topicTagId: row.topic_tag_id,
        createdAt: row.created_at
      });
    }

    const { data: existingPT } = await supabase
      .from("place_topics")
      .select("id, weight")
      .eq("place_id", placeId)
      .eq("topic_tag_id", tagId)
      .maybeSingle();

    if (existingPT) {
      const pt = existingPT as { id: string; weight: number };
      await supabase
        .from("place_topics")
        .update({ weight: pt.weight + 1, last_activity_at: new Date().toISOString() })
        .eq("id", pt.id);
    } else {
      await supabase
        .from("place_topics")
        .insert({ place_id: placeId, topic_tag_id: tagId, weight: 1, last_activity_at: new Date().toISOString() });
    }

    const userId = await getCurrentUserId();
    if (userId) {
      const { data: existingInterest } = await supabase
        .from("user_topic_interests")
        .select("id, weight")
        .eq("user_id", userId)
        .eq("topic_tag_id", tagId)
        .maybeSingle();

      if (existingInterest) {
        const interest = existingInterest as { id: string; weight: number };
        await supabase
          .from("user_topic_interests")
          .update({ weight: interest.weight + 1 })
          .eq("id", interest.id);
      } else {
        await supabase
          .from("user_topic_interests")
          .insert({ user_id: userId, topic_tag_id: tagId, source: "hashtag", weight: 1 });
      }
    }
  }

  return results;
}

export async function getUserTopicInterests(): Promise<UserTopicInterest[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_topic_interests")
    .select("*, topic_tags(*)")
    .eq("user_id", userId)
    .order("weight", { ascending: false });

  if (error) {
    console.warn("[graph] getUserTopicInterests error:", error.message);
    return [];
  }
  return (data as UserTopicInterestRow[]).map(mapUserTopicInterest);
}

export async function upsertUserTopicInterest(
  topicName: string,
  source: "manual" | "hashtag" | "derived" = "manual"
): Promise<UserTopicInterest | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const slug = slugify(topicName);
  if (!slug) return null;

  let tagId: string;

  const { data: existingTag } = await supabase
    .from("topic_tags")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingTag) {
    tagId = (existingTag as { id: string }).id;
  } else {
    const { data: newTag, error: tagError } = await supabase
      .from("topic_tags")
      .insert({ name: topicName.toLowerCase(), slug })
      .select("id")
      .single();

    if (tagError || !newTag) {
      console.warn("[graph] upsertUserTopicInterest: could not create tag:", tagError?.message);
      return null;
    }
    tagId = (newTag as { id: string }).id;
  }

  const { data: existing } = await supabase
    .from("user_topic_interests")
    .select("*")
    .eq("user_id", userId)
    .eq("topic_tag_id", tagId)
    .maybeSingle();

  if (existing) {
    const row = existing as UserTopicInterestRow;
    const { data, error } = await supabase
      .from("user_topic_interests")
      .update({ weight: row.weight + 1 })
      .eq("id", row.id)
      .select("*, topic_tags(*)")
      .single();

    if (error) {
      console.warn("[graph] upsertUserTopicInterest update error:", error.message);
      return null;
    }
    return mapUserTopicInterest(data as UserTopicInterestRow);
  }

  const { data, error } = await supabase
    .from("user_topic_interests")
    .insert({ user_id: userId, topic_tag_id: tagId, source, weight: 1 })
    .select("*, topic_tags(*)")
    .single();

  if (error) {
    console.warn("[graph] upsertUserTopicInterest insert error:", error.message);
    return null;
  }
  return mapUserTopicInterest(data as UserTopicInterestRow);
}

export async function getMyConnections(): Promise<UserConnection[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_connections")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("weight", { ascending: false })
    .limit(50);

  if (error) {
    console.warn("[graph] getMyConnections error:", error.message);
    return [];
  }
  return (data as UserConnectionRow[]).map(mapUserConnection);
}
