"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteNotification,
  fetchNotificationPreferences,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type NotificationPreferences,
  type NotificationType,
} from "@/lib/api/notifications";
import { useAuth } from "@/hooks/use-auth";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: Record<string, unknown>) =>
    ["notifications", "list", params] as const,
  unread: ["notifications", "unread"] as const,
  preferences: ["notifications", "preferences"] as const,
};

export function useNotifications(params: {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: NotificationType | "all";
}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadNotificationCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => {
      const data = await fetchUnreadNotificationCount();
      return data.count;
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.unread });
      const previous = qc.getQueryData<number>(notificationKeys.unread);
      qc.setQueryData(notificationKeys.unread, 0);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(notificationKeys.unread, ctx.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useNotificationPreferences() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: async () => {
      const data = await fetchNotificationPreferences();
      return data.preferences;
    },
    enabled: isAuthenticated,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Partial<Omit<NotificationPreferences, "securityEmails" | "updatedAt">>,
    ) => updateNotificationPreferences(body),
    onSuccess: (data) => {
      qc.setQueryData(notificationKeys.preferences, data.preferences);
    },
  });
}
