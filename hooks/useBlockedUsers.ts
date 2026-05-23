import { useCallback, useEffect, useState } from "react";

import { listBlockedUserIds } from "../services/moderation";

export function useBlockedUsers() {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const ids = await listBlockedUserIds();
      setBlockedIds(new Set(ids));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markBlocked = useCallback((userId: string) => {
    setBlockedIds((current) => {
      if (current.has(userId)) return current;
      const next = new Set(current);
      next.add(userId);
      return next;
    });
  }, []);

  const markUnblocked = useCallback((userId: string) => {
    setBlockedIds((current) => {
      if (!current.has(userId)) return current;
      const next = new Set(current);
      next.delete(userId);
      return next;
    });
  }, []);

  const isBlocked = useCallback((userId: string | null | undefined) => Boolean(userId && blockedIds.has(userId)), [blockedIds]);

  return { blockedIds, isBlocked, loading, refresh, markBlocked, markUnblocked };
}
