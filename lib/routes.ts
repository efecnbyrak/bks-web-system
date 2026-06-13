export const ROUTES = {
    // Root
    HOME: "/",

    // Referee routes
    REFEREE: "/referee",
    REFEREE_PROFILE: "/referee/profile",
    REFEREE_AVAILABILITY: "/referee/availability",
    REFEREE_MATCHES: "/referee/matches",
    REFEREE_ANNOUNCEMENTS: "/referee/announcements",
    REFEREE_RESULTS: "/referee/results",
    REFEREE_REPORTS_NEW: "/referee/reports/new",
    REFEREE_BAG: "/referee/bag",
    REFEREE_BAG_RULES: "/referee/bag/rules",
    REFEREE_BAG_QUESTIONS: "/referee/bag/questions",
    REFEREE_BAG_VIDEOS: "/referee/bag/videos",
    REFEREE_EXAM: "/referee/exam",

    // General official routes
    GENERAL: "/general",
    GENERAL_PROFILE: "/general/profile",
    GENERAL_AVAILABILITY: "/general/availability",
    GENERAL_MATCHES: "/general/matches",
    GENERAL_ANNOUNCEMENTS: "/general/announcements",
    GENERAL_BAG: "/general/bag",
    GENERAL_EXAM: "/general/exam",
    GENERAL_REPORTS_NEW: "/general/reports/new",

    // Admin routes
    ADMIN: "/admin",
    ADMIN_REFEREES: "/admin/referees",
    ADMIN_OFFICIALS: "/admin/officials",
    ADMIN_APPROVALS: "/admin/approvals",
    ADMIN_ANNOUNCEMENTS: "/admin/announcements",
    ADMIN_BAG: "/admin/bag",
    ADMIN_ALL_AVAILABILITIES: "/admin/all-availabilities",
    ADMIN_OBSERVER_REPORTS: "/admin/observer-reports",
    ADMIN_ATAMALAR: "/admin/atamalar",
    ADMIN_USER_MATCHES: "/admin/user-matches",
    ADMIN_PAYMENTS: "/admin/payments",
    ADMIN_ACHIEVEMENTS: "/admin/achievements",
    ADMIN_LOGS: "/admin/logs",
    ADMIN_SETTINGS: "/admin/settings",
    ADMIN_MATCHES: "/admin/matches",

    // API routes
    API_MATCHES_NOTIFICATION: "/api/matches/notification",
    API_ANNOUNCEMENTS_UNREAD: "/api/announcements/unread",
    API_USER_ASSIGNMENTS: "/api/user/assignments",
    API_USER_EXAM_HISTORY: "/api/user/exam-history",
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];
