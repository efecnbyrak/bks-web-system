export interface UserAchievementData {
    id: number;
    userId: number;
    type: "referee" | "official";
    firstName: string;
    lastName: string;
    email: string;
    category: string;
    examAttempts: {
        id: number;
        score: number;
        totalQuestions: number;
        difficulty: string | null;
        createdAt: Date;
    }[];
    ruleProgressCount: number;
    yorumProgressCount: number;
    kuralVisited: boolean;
    yorumVisited: boolean;
    completedAssignments: number;
    totalAssignments: number;
    videoWatchedCount: number;
    totalVideoCount: number;
    xp: number;
    rank: string;
    earnedAchievements: string[];
}

export const RANK_LEVELS = [
    { name: "Başlangıç", minXP: 0, maxXP: 500 },
    { name: "Bronz", minXP: 500, maxXP: 1500 },
    { name: "Gümüş", minXP: 1500, maxXP: 3500 },
    { name: "Altın", minXP: 3500, maxXP: 7000 },
    { name: "Elmas", minXP: 7000, maxXP: Infinity },
];
