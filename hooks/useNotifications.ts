"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ROUTES } from "@/lib/routes";

export interface TicketReply {
    id: number;
    subject: string;
    adminNote: string;
    status: string;
    type: string;
    updatedAt: string;
}

export interface NotificationState {
    hasNewMatches: boolean;
    unreadAnnouncements: number;
    hasNewTicketReply: boolean;
    ticketReplies: TicketReply[];
    lastFetchedAt: Date | null;
}

interface UseNotificationsOptions {
    include?: {
        matches?: boolean;
        announcements?: boolean;
        tickets?: boolean;
    };
    intervalMs?: number;
}

// Exponential backoff steps on consecutive errors
const BACKOFF_MS = [30_000, 60_000, 120_000, 240_000, 300_000];

export function useNotifications(options: UseNotificationsOptions = {}) {
    const include = {
        matches: options.include?.matches ?? true,
        announcements: options.include?.announcements ?? true,
        tickets: options.include?.tickets ?? true,
    };
    const intervalMs = options.intervalMs ?? 30_000;

    const [state, setState] = useState<NotificationState>({
        hasNewMatches: false,
        unreadAnnouncements: 0,
        hasNewTicketReply: false,
        ticketReplies: [],
        lastFetchedAt: null,
    });

    const errorCountRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);

    // Stable refs for include flags so poll callback doesn't need them as deps
    const includeRef = useRef(include);
    includeRef.current = include;
    const intervalMsRef = useRef(intervalMs);
    intervalMsRef.current = intervalMs;

    const poll = useCallback(async () => {
        // Skip poll when tab is hidden — saves DB connections
        if (typeof document !== "undefined" && document.visibilityState !== "visible") {
            timerRef.current = setTimeout(poll, intervalMsRef.current);
            return;
        }

        try {
            let matchesResult = false;
            let announcementsResult = 0;
            let ticketReplyResult = false;
            let ticketRepliesResult: TicketReply[] = [];

            const fetches: Promise<void>[] = [];

            if (includeRef.current.matches) {
                fetches.push(
                    fetch(ROUTES.API_MATCHES_NOTIFICATION, { credentials: "include" })
                        .then((r) => (r.ok ? r.json() : null))
                        .then((data) => { if (data) matchesResult = !!data.hasNew; })
                        .catch(() => {})
                );
            }

            if (includeRef.current.announcements) {
                fetches.push(
                    fetch(ROUTES.API_ANNOUNCEMENTS_UNREAD, { credentials: "include" })
                        .then((r) => (r.ok ? r.json() : null))
                        .then((data) => { if (data) announcementsResult = data.count ?? 0; })
                        .catch(() => {})
                );
            }

            if (includeRef.current.tickets) {
                fetches.push(
                    fetch(ROUTES.API_TICKETS_CHECK_REPLIES, { credentials: "include" })
                        .then((r) => (r.ok ? r.json() : null))
                        .then((data) => {
                            if (data) {
                                ticketReplyResult = !!data.hasNewReply;
                                ticketRepliesResult = data.tickets ?? [];
                            }
                        })
                        .catch(() => {})
                );
            }

            await Promise.all(fetches);

            if (!isMountedRef.current) return;

            errorCountRef.current = 0;

            setState({
                hasNewMatches: matchesResult,
                unreadAnnouncements: announcementsResult,
                hasNewTicketReply: ticketReplyResult,
                ticketReplies: ticketRepliesResult,
                lastFetchedAt: new Date(),
            });

            timerRef.current = setTimeout(poll, intervalMsRef.current);
        } catch {
            if (!isMountedRef.current) return;
            errorCountRef.current += 1;
            const delay = BACKOFF_MS[Math.min(errorCountRef.current - 1, BACKOFF_MS.length - 1)];
            timerRef.current = setTimeout(poll, delay);
        }
    }, []); // empty deps — uses refs for all mutable values

    useEffect(() => {
        isMountedRef.current = true;
        poll();

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                if (timerRef.current) clearTimeout(timerRef.current);
                poll();
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            isMountedRef.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [poll]);

    const clearMatchNotification = useCallback(() => {
        setState((prev) => ({ ...prev, hasNewMatches: false }));
    }, []);

    const clearAnnouncementNotification = useCallback(() => {
        setState((prev) => ({ ...prev, unreadAnnouncements: 0 }));
    }, []);

    const clearTicketReplyNotification = useCallback(() => {
        setState((prev) => ({ ...prev, hasNewTicketReply: false, ticketReplies: [] }));
    }, []);

    return {
        ...state,
        clearMatchNotification,
        clearAnnouncementNotification,
        clearTicketReplyNotification,
    };
}
