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
    { name: "Başlangıç", minXP: 0, maxXP: 100 },
    { name: "Bronz", minXP: 100, maxXP: 500 },
    { name: "Gümüş", minXP: 500, maxXP: 1500 },
    { name: "Altın", minXP: 1500, maxXP: 4000 },
    { name: "Platin", minXP: 4000, maxXP: 8000 },
    { name: "Elmas", minXP: 8000, maxXP: 15000 },
    { name: "Master", minXP: 15000, maxXP: 25000 },
    { name: "Legend", minXP: 25000, maxXP: Infinity },
];
